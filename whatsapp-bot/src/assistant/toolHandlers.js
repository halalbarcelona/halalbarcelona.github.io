import { findItem } from '../menu/menuService.js';
import { buildOrderSummary } from '../orders/orderCalculator.js';
import {
  STATES,
  assertCanAddItem,
  assertCanSetFulfilment,
  assertCanConfirm,
  assertCanCancel,
  stateAfterItemsChanged,
} from '../orders/orderState.js';

/**
 * Builds the tool handlers used by the Claude tool-use loop. Each handler
 * mutates the session's order state in place and returns a plain object
 * that gets serialized back to the model as a tool_result — the model
 * never sees or computes prices directly, only what these handlers return.
 */
export function createToolHandlers({ menuData, notifyOwner }) {
  return {
    async list_menu(_session, input = {}) {
      const categories = input.category
        ? menuData.categories.filter(
            (c) => c.id === input.category || c.name.toLowerCase() === String(input.category).toLowerCase()
          )
        : menuData.categories;

      if (categories.length === 0) {
        return { success: false, error: `No category matches "${input.category}".` };
      }

      return {
        success: true,
        categories: categories.map((c) => ({
          name: c.name,
          items: c.items.map((i) => ({
            name: i.name,
            price: i.price,
            description: i.description,
            tags: i.tags || [],
          })),
        })),
      };
    },

    async add_item(session, input = {}) {
      try {
        assertCanAddItem(session);
      } catch (err) {
        return { success: false, error: err.message };
      }

      const match = findItem(input.item_name, menuData);
      if (!match) {
        return {
          success: false,
          error: `No menu item matches "${input.item_name}". Ask the customer to clarify, or call list_menu.`,
        };
      }

      const quantity = Number.isInteger(input.quantity) && input.quantity > 0 ? input.quantity : 1;
      const notes = input.notes || null;
      const existing = session.items.find((i) => i.menuItemId === match.item.id && i.notes === notes);

      if (existing) {
        existing.quantity += quantity;
      } else {
        session.items.push({
          menuItemId: match.item.id,
          name: match.item.name,
          unitPrice: match.item.price,
          quantity,
          notes,
        });
      }

      session.state = stateAfterItemsChanged(session.items);
      return { success: true, matchedItem: match.item.name, summary: buildOrderSummary(session.items) };
    },

    async remove_item(session, input = {}) {
      const match = findItem(input.item_name, menuData);
      if (!match) {
        return { success: false, error: `No menu item matches "${input.item_name}".` };
      }

      const existing = session.items.find((i) => i.menuItemId === match.item.id);
      if (!existing) {
        return { success: false, error: `"${match.item.name}" is not currently in the order.` };
      }

      if (Number.isInteger(input.quantity) && input.quantity > 0 && input.quantity < existing.quantity) {
        existing.quantity -= input.quantity;
      } else {
        session.items = session.items.filter((i) => i !== existing);
      }

      session.state = stateAfterItemsChanged(session.items);
      return { success: true, summary: buildOrderSummary(session.items) };
    },

    async update_quantity(session, input = {}) {
      const match = findItem(input.item_name, menuData);
      if (!match) {
        return { success: false, error: `No menu item matches "${input.item_name}".` };
      }

      const existing = session.items.find((i) => i.menuItemId === match.item.id);
      if (!existing) {
        return { success: false, error: `"${match.item.name}" is not currently in the order. Use add_item instead.` };
      }

      if (!Number.isInteger(input.quantity) || input.quantity < 0) {
        return { success: false, error: 'quantity must be a non-negative whole number.' };
      }

      if (input.quantity === 0) {
        session.items = session.items.filter((i) => i !== existing);
      } else {
        existing.quantity = input.quantity;
      }

      session.state = stateAfterItemsChanged(session.items);
      return { success: true, summary: buildOrderSummary(session.items) };
    },

    async set_fulfilment(session, input = {}) {
      try {
        assertCanSetFulfilment(session);
      } catch (err) {
        return { success: false, error: err.message };
      }

      if (!['pickup', 'delivery'].includes(input.type)) {
        return { success: false, error: 'type must be "pickup" or "delivery".' };
      }

      session.fulfilment = { type: input.type, note: input.note || null };
      session.state = STATES.AWAITING_CONFIRMATION;
      return { success: true, fulfilment: session.fulfilment, summary: buildOrderSummary(session.items) };
    },

    async get_order_summary(session) {
      return {
        success: true,
        summary: buildOrderSummary(session.items),
        fulfilment: session.fulfilment,
        state: session.state,
      };
    },

    async confirm_order(session) {
      try {
        assertCanConfirm(session);
      } catch (err) {
        return { success: false, error: err.message };
      }

      const summary = buildOrderSummary(session.items);
      session.state = STATES.CONFIRMED;

      try {
        await notifyOwner({ session, summary });
        return { success: true, summary, ownerNotified: true };
      } catch (err) {
        return {
          success: true,
          summary,
          ownerNotified: false,
          warning: 'Order confirmed but notifying the restaurant failed — mention this to the customer.',
        };
      }
    },

    async cancel_order(session) {
      try {
        assertCanCancel(session);
      } catch (err) {
        return { success: false, error: err.message };
      }

      session.items = [];
      session.fulfilment = { type: null, note: null };
      session.state = STATES.CANCELLED;
      return { success: true };
    },
  };
}
