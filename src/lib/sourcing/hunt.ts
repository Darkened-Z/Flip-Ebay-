import {
  searchCandidates,
  dealsCandidates,
  ebayActive,
  cleanQuery,
  demandScore,
  type Candidate,
} from "@/lib/scan/discover";
import { buildHuntSeeds } from "./seeds";

export type HuntResult = {
  winners: Candidate[];
  scanned: number;
  seeds: string[];
};

// Profit × velocity, penalized by how many active eBay listings compete for the
// same sale (fewer competitors => easier/faster sale => higher rank). Unknown
// competition ranks on demand alone — never with a fabricated boost.
function composite(c: Candidate): number {
  const base = demandScore(c.net, c.soldCount);
  if (c.competition == null) return base;
  return base / (1 + Math.log10(1 + c.competition / 25));
}

// Autonomous hunt: FLIP picks categories itself, scans Amazon search (2 pages)
// + today's deals, checks each against eBay sold comps, and returns the ones
// selling higher on eBay. The strongest candidates also get a competition pass
// so low-competition items rank highest.
export async function runHunt(
  seedCount = 4,
  perSeed = 6,
): Promise<HuntResult> {
  const seeds = buildHuntSeeds(new Date(), seedCount);

  const batches = await Promise.all([
    ...seeds.map((s) =>
      searchCandidates(s, perSeed, 2).catch(() => [] as Candidate[]),
    ),
    dealsCandidates(perSeed).catch(() => [] as Candidate[]),
  ]);

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

  // A wider pool enters the competition pass than we ultimately show, so a
  // low-competition item that ranked just outside the top by raw demand can
  // still surface once competition factors into the final composite ranking.
  // soldCount >= 3 (not 2) keeps the velocity signal off 2-comp noise.
  const pool = deduped
    .filter((c) => c.net > 0 && c.soldCount >= 3)
    .sort(
      (a, b) => demandScore(b.net, b.soldCount) - demandScore(a.net, a.soldCount),
    )
    .slice(0, 20);

  const seKey = process.env.SERPAPI_KEY;
  if (seKey) {
    await Promise.all(
      pool.map(async (c) => {
        const active = await ebayActive(cleanQuery(c.title), seKey);
        if (active != null) c.competition = active;
      }),
    );
  }

  const winners = pool
    .sort((a, b) => composite(b) - composite(a))
    .slice(0, 15);
  return { winners, scanned: deduped.length, seeds };
}
