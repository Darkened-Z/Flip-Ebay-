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

// Profit × velocity, boosted by sell-through (low competition sells faster).
function composite(c: Candidate): number {
  const base = demandScore(c.net, c.soldCount);
  const st = c.sellThrough ?? 50;
  return base * (0.5 + st / 100);
}

// Autonomous hunt: FLIP picks categories itself, scans Amazon search (2 pages)
// + today's deals, checks each against eBay sold comps, and returns the ones
// selling higher on eBay. The top winners also get a competition / sell-through
// pass so low-competition fast sellers rank highest.
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

  let winners = deduped
    .filter((c) => c.net > 0 && c.soldCount >= 2)
    .sort(
      (a, b) => demandScore(b.net, b.soldCount) - demandScore(a.net, a.soldCount),
    )
    .slice(0, 15); // cap the expensive competition pass

  const seKey = process.env.SERPAPI_KEY;
  if (seKey) {
    await Promise.all(
      winners.map(async (c) => {
        const active = await ebayActive(cleanQuery(c.title), seKey);
        c.competition = active;
        c.sellThrough =
          c.soldCount + active > 0
            ? Math.round((c.soldCount / (c.soldCount + active)) * 100)
            : undefined;
      }),
    );
  }

  winners.sort((a, b) => composite(b) - composite(a));
  return { winners, scanned: deduped.length, seeds };
}
