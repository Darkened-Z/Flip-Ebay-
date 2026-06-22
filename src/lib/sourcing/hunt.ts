import {
  searchCandidates,
  demandScore,
  type Candidate,
} from "@/lib/scan/discover";
import { buildHuntSeeds } from "./seeds";

export type HuntResult = {
  winners: Candidate[];
  scanned: number;
  seeds: string[];
};

// Autonomous product hunt: FLIP picks the categories itself, scans Amazon
// products, checks each against eBay sold comps, and returns only the ones
// that pass the filters — Prime/ships-from-Amazon AND profitable AND actually
// selling on eBay.
export async function runHunt(
  seedCount = 4,
  perSeed = 6,
): Promise<HuntResult> {
  const seeds = buildHuntSeeds(new Date(), seedCount);

  const batches = await Promise.all(
    seeds.map((s) => searchCandidates(s, perSeed).catch(() => [] as Candidate[])),
  );

  // Dedupe across seeds by ASIN, keeping the strongest score.
  const byAsin = new Map<string, Candidate>();
  for (const c of batches.flat()) {
    const prev = byAsin.get(c.asin);
    if (
      !prev ||
      demandScore(c.net, c.soldCount) > demandScore(prev.net, prev.soldCount)
    ) {
      byAsin.set(c.asin, c);
    }
  }
  const deduped = [...byAsin.values()];

  // Keep products that sell higher on eBay than they cost (positive net) AND
  // have real eBay demand (2+ sold). The ships-from-Amazon / Prime check runs
  // at the deep Scan, where the data is reliable (search-result is_prime is
  // not). The strongest are flagged "worth it" on the card (net >= $5, 3+ sold).
  const winners = deduped
    .filter((c) => c.net > 0 && c.soldCount >= 2)
    .sort(
      (a, b) => demandScore(b.net, b.soldCount) - demandScore(a.net, a.soldCount),
    );

  return { winners, scanned: deduped.length, seeds };
}
