import { describe, it, expect } from 'vitest';
import { lineTotal, orderTotal, formatCurrency, buildOrderSummary } from '../src/orders/orderCalculator.js';

describe('orderCalculator', () => {
  const items = [
    { name: 'Kebab de Pollo', unitPrice: 6.5, quantity: 2 },
    { name: 'Coca-Cola', unitPrice: 2, quantity: 1 },
  ];

  it('computes a single line total', () => {
    expect(lineTotal(items[0])).toBe(13);
  });

  it('sums line totals into an order total', () => {
    expect(orderTotal(items)).toBe(15);
  });

  it('formats currency with two decimals and a euro sign', () => {
    expect(formatCurrency(6.5)).toBe('6.50€');
  });

  it('avoids floating point drift on repeated decimal prices', () => {
    expect(orderTotal([{ unitPrice: 0.1, quantity: 3 }])).toBe(0.3);
  });

  it('builds a full itemized summary', () => {
    const summary = buildOrderSummary(items);
    expect(summary.total).toBe(15);
    expect(summary.lines).toHaveLength(2);
    expect(summary.lines[0].lineTotal).toBe(13);
  });

  it('returns a zero total for an empty order', () => {
    expect(orderTotal([])).toBe(0);
  });
});
