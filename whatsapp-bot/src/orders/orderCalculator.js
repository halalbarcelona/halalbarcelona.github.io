function round2(amount) {
  return Math.round(amount * 100) / 100;
}

export function lineTotal(item) {
  return round2(item.unitPrice * item.quantity);
}

export function orderTotal(items) {
  return round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function formatCurrency(amount) {
  return `${amount.toFixed(2)}€`;
}

/**
 * The single source of truth for what an order costs. Never let the
 * assistant state a price that didn't come from this function.
 */
export function buildOrderSummary(items) {
  return {
    lines: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: lineTotal(item),
    })),
    total: orderTotal(items),
  };
}
