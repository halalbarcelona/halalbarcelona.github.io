export function formatDecimalEs(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}

export function formatSignedDecimalEs(n: number, digits = 1): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${sign}${formatDecimalEs(Math.abs(n), digits)}`;
}

export function formatSignedInt(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${sign}${Math.abs(n)}`;
}

export function formatPercentEs(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatSignedPercentPoints(n: number): string {
  const points = Math.round(n * 100);
  const sign = points > 0 ? "+" : points < 0 ? "−" : "±";
  return `${sign}${Math.abs(points)} pp`;
}
