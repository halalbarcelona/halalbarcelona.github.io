export const tools = [
  {
    name: 'list_menu',
    description:
      'Returns the restaurant menu with real item names, descriptions and prices. Use this whenever the customer asks what is available, in general or within a category.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category name or id to filter by, e.g. "Kebabs" or "drinks".',
        },
      },
    },
  },
  {
    name: 'add_item',
    description:
      "Adds a menu item to the customer's current order. Use this whenever the customer asks for a menu item, even if the name doesn't exactly match — the system will find the closest match. If no confident match is found, it returns an error so you can ask a clarifying question instead of guessing.",
    input_schema: {
      type: 'object',
      properties: {
        item_name: { type: 'string', description: "The item the customer asked for, in their own words." },
        quantity: { type: 'integer', description: 'How many of this item. Defaults to 1.' },
        notes: { type: 'string', description: 'Optional special request for this item, e.g. "no onions".' },
      },
      required: ['item_name'],
    },
  },
  {
    name: 'remove_item',
    description: "Removes a menu item (or reduces its quantity) from the customer's current order.",
    input_schema: {
      type: 'object',
      properties: {
        item_name: { type: 'string', description: 'The item to remove.' },
        quantity: {
          type: 'integer',
          description: 'How many to remove. Omit to remove all of that item.',
        },
      },
      required: ['item_name'],
    },
  },
  {
    name: 'update_quantity',
    description: "Sets the exact quantity of an item already in the order (e.g. \"make that 3 instead\").",
    input_schema: {
      type: 'object',
      properties: {
        item_name: { type: 'string', description: 'The item already in the order.' },
        quantity: { type: 'integer', description: 'The new total quantity. Use 0 to remove it.' },
      },
      required: ['item_name', 'quantity'],
    },
  },
  {
    name: 'set_fulfilment',
    description:
      'Records whether the customer wants pickup or delivery, plus any note (e.g. delivery address, pickup time). Call this once the customer has finished choosing items.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['pickup', 'delivery'] },
        note: { type: 'string', description: 'Delivery address, pickup time, or other logistics note.' },
      },
      required: ['type'],
    },
  },
  {
    name: 'get_order_summary',
    description:
      "Returns the current itemized order and the correct total, freshly computed. Always call this before telling the customer their total, and never state a different number than what this returns.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'confirm_order',
    description:
      'Finalizes the order and sends it to the restaurant. Only call this after showing the customer the order summary (via get_order_summary) and receiving an explicit "yes" from them.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'cancel_order',
    description: 'Cancels the current in-progress order, e.g. if the customer wants to start over.',
    input_schema: { type: 'object', properties: {} },
  },
];
