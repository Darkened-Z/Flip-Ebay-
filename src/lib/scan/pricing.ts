const round2 = (n: number) => Math.round(n * 100) / 100;

export function median(prices: number[]): number {
  const s = [...prices].filter((p) => p > 0).sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  const m = Math.floor(n / 2);
  return round2(n % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}

// The price you'd realistically LIST at to sell quickly: the lower quartile of
// sold comps — below the median so it moves fast, but not the give-away floor
// (which is usually a damaged item, listing error, or fluke). Defaults to ~the
// 25th percentile; for a handful of comps it falls back to the 2nd-lowest. Pair
// with a velocity check (enough sold comps) before trusting it.
export function quickSalePrice(prices: number[], percentile = 0.25): number {
  const s = [...prices].filter((p) => p > 0).sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  if (n <= 3) return round2(s[Math.min(1, n - 1)]); // 2nd lowest (or lowest if tiny)
  const idx = Math.min(n - 1, Math.max(1, Math.round(n * percentile)));
  return round2(s[idx]);
}
