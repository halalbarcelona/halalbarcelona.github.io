export const STATES = Object.freeze({
  IDLE: 'IDLE',
  BUILDING: 'BUILDING',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
});

export class OrderStateError extends Error {}

export function assertCanAddItem(session) {
  if (session.state === STATES.CONFIRMED) {
    throw new OrderStateError('This order was already confirmed. Start a new order to add more items.');
  }
}

export function assertCanSetFulfilment(session) {
  if (session.items.length === 0) {
    throw new OrderStateError('Add at least one item before choosing pickup or delivery.');
  }
  if (session.state === STATES.CONFIRMED) {
    throw new OrderStateError('This order was already confirmed.');
  }
}

export function assertCanConfirm(session) {
  if (session.items.length === 0) {
    throw new OrderStateError('Cannot confirm an empty order.');
  }
  if (!session.fulfilment || !session.fulfilment.type) {
    throw new OrderStateError('Ask whether the customer wants pickup or delivery before confirming.');
  }
  if (session.state !== STATES.AWAITING_CONFIRMATION) {
    throw new OrderStateError('Show the order summary and get an explicit yes from the customer before confirming.');
  }
}

export function assertCanCancel(session) {
  if (session.state === STATES.CONFIRMED) {
    throw new OrderStateError('This order was already confirmed and cannot be cancelled here.');
  }
}

/** State to move to right after items were added/removed/changed. */
export function stateAfterItemsChanged(items) {
  return items.length === 0 ? STATES.IDLE : STATES.BUILDING;
}
