/** 0.4567 -> "46%". null (nothing to divide by) -> "–". */
export function formatPercent(fraction: number | null): string {
  if (fraction === null || Number.isNaN(fraction)) return '–';
  return `${Math.round(fraction * 100)}%`;
}

/** Safe division for rates: no denominator means "no rate", not Infinity or NaN. */
export function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}
