import { describe, it, expect } from 'vitest';
import {
  STATES,
  OrderStateError,
  assertCanAddItem,
  assertCanSetFulfilment,
  assertCanConfirm,
  assertCanCancel,
  stateAfterItemsChanged,
} from '../src/orders/orderState.js';

describe('orderState', () => {
  it('stateAfterItemsChanged returns IDLE for no items, BUILDING otherwise', () => {
    expect(stateAfterItemsChanged([])).toBe(STATES.IDLE);
    expect(stateAfterItemsChanged([{}])).toBe(STATES.BUILDING);
  });

  it('assertCanAddItem blocks adding to an already confirmed order', () => {
    expect(() => assertCanAddItem({ state: STATES.CONFIRMED })).toThrow(OrderStateError);
    expect(() => assertCanAddItem({ state: STATES.BUILDING })).not.toThrow();
  });

  it('assertCanSetFulfilment requires a non-empty, unconfirmed order', () => {
    expect(() => assertCanSetFulfilment({ items: [], state: STATES.IDLE })).toThrow(OrderStateError);
    expect(() => assertCanSetFulfilment({ items: [{}], state: STATES.CONFIRMED })).toThrow(OrderStateError);
    expect(() => assertCanSetFulfilment({ items: [{}], state: STATES.BUILDING })).not.toThrow();
  });

  it('assertCanConfirm requires items, a set fulfilment, and awaiting-confirmation state', () => {
    expect(() =>
      assertCanConfirm({ items: [], fulfilment: { type: 'pickup' }, state: STATES.AWAITING_CONFIRMATION })
    ).toThrow(OrderStateError);
    expect(() =>
      assertCanConfirm({ items: [{}], fulfilment: { type: null }, state: STATES.AWAITING_CONFIRMATION })
    ).toThrow(OrderStateError);
    expect(() =>
      assertCanConfirm({ items: [{}], fulfilment: { type: 'pickup' }, state: STATES.BUILDING })
    ).toThrow(OrderStateError);
    expect(() =>
      assertCanConfirm({ items: [{}], fulfilment: { type: 'pickup' }, state: STATES.AWAITING_CONFIRMATION })
    ).not.toThrow();
  });

  it('assertCanCancel only blocks cancelling an already confirmed order', () => {
    expect(() => assertCanCancel({ state: STATES.CONFIRMED })).toThrow(OrderStateError);
    expect(() => assertCanCancel({ state: STATES.BUILDING })).not.toThrow();
  });
});
