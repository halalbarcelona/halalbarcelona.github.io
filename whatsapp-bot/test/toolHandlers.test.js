import { describe, it, expect, vi } from 'vitest';
import { createToolHandlers } from '../src/assistant/toolHandlers.js';
import { STATES } from '../src/orders/orderState.js';

const menuData = {
  restaurant: { name: 'Test Resto', address: 'x', hours: 'x', phone: 'x' },
  categories: [
    {
      id: 'mains',
      name: 'Mains',
      items: [
        { id: 'item-a', name: 'Item A', aliases: ['a'], price: 5, description: 'desc', tags: [] },
        { id: 'item-b', name: 'Item B', aliases: [], price: 3, description: 'desc', tags: [] },
      ],
    },
  ],
};

function makeSession() {
  return {
    phone: 'whatsapp:+1234',
    customerName: null,
    language: 'es',
    state: STATES.IDLE,
    items: [],
    fulfilment: { type: null, note: null },
    history: [],
  };
}

describe('toolHandlers', () => {
  it('add_item adds a matched item and moves the session to BUILDING', async () => {
    const handlers = createToolHandlers({ menuData, notifyOwner: vi.fn() });
    const session = makeSession();

    const result = await handlers.add_item(session, { item_name: 'item a', quantity: 2 });

    expect(result.success).toBe(true);
    expect(session.items).toHaveLength(1);
    expect(session.items[0].quantity).toBe(2);
    expect(session.state).toBe(STATES.BUILDING);
    expect(result.summary.total).toBe(10);
  });

  it('add_item returns an error instead of guessing for an unknown item', async () => {
    const handlers = createToolHandlers({ menuData, notifyOwner: vi.fn() });
    const session = makeSession();

    const result = await handlers.add_item(session, { item_name: 'completely unrelated sushi platter' });

    expect(result.success).toBe(false);
    expect(session.items).toHaveLength(0);
  });

  it('confirm_order fails before fulfilment has been set', async () => {
    const handlers = createToolHandlers({ menuData, notifyOwner: vi.fn() });
    const session = makeSession();
    await handlers.add_item(session, { item_name: 'item a' });

    const result = await handlers.confirm_order(session);

    expect(result.success).toBe(false);
    expect(session.state).not.toBe(STATES.CONFIRMED);
  });

  it('runs the full happy path and notifies the owner exactly once', async () => {
    const notifyOwner = vi.fn().mockResolvedValue(undefined);
    const handlers = createToolHandlers({ menuData, notifyOwner });
    const session = makeSession();

    await handlers.add_item(session, { item_name: 'item a', quantity: 1 });
    await handlers.set_fulfilment(session, { type: 'pickup' });
    expect(session.state).toBe(STATES.AWAITING_CONFIRMATION);

    const result = await handlers.confirm_order(session);

    expect(result.success).toBe(true);
    expect(result.ownerNotified).toBe(true);
    expect(session.state).toBe(STATES.CONFIRMED);
    expect(notifyOwner).toHaveBeenCalledOnce();
  });

  it('still confirms the order but flags a warning if notifying the owner fails', async () => {
    const notifyOwner = vi.fn().mockRejectedValue(new Error('network down'));
    const handlers = createToolHandlers({ menuData, notifyOwner });
    const session = makeSession();

    await handlers.add_item(session, { item_name: 'item a' });
    await handlers.set_fulfilment(session, { type: 'delivery', note: 'Calle X' });
    const result = await handlers.confirm_order(session);

    expect(result.success).toBe(true);
    expect(result.ownerNotified).toBe(false);
    expect(session.state).toBe(STATES.CONFIRMED);
  });

  it('cancel_order clears items and resets fulfilment', async () => {
    const handlers = createToolHandlers({ menuData, notifyOwner: vi.fn() });
    const session = makeSession();
    await handlers.add_item(session, { item_name: 'item a' });

    const result = await handlers.cancel_order(session);

    expect(result.success).toBe(true);
    expect(session.items).toHaveLength(0);
    expect(session.state).toBe(STATES.CANCELLED);
  });
});
