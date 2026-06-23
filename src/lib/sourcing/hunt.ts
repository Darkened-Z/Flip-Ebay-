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
  nearMisses: Candidate[]; // closest profitable-ish candidates when winners are thin
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

// Autonomous hunt: FLIP picks categories itself, scans Amazon search + today's
// deals, checks each against eBay sold comps, and returns the ones selling
// higher on eBay. Defaults are tuned for a FREE API tier — 1 search page and no
// competition pass — which costs roughly seedCount*perSeed + perSeed SerpApi
// calls per run. Pass { pages: 2, competition: true } for a richer, pricier run.
export async function runHunt(
  seedCount = 3,
  perSeed = 3,
  opts: { pages?: number; competition?: boolean } = {},
): Promise<HuntResult> {
  const pages = opts.pages ?? 1;
  const withCompetition = opts.competition ?? false;
  const seeds = buildHuntSeeds(new Date(), seedCount);

  const batches = await Promise.all([
    ...seeds.map((s) =>
      searchCandidates(s, perSeed, pages).catch(() => [] as Candidate[]),
    ),
    // Lean toward the deals feed — discounted items are the likeliest to have
    // real Amazon -> eBay spread, far more than commodity category searches.
    dealsCandidates(perSeed * 2).catch(() => [] as Candidate[]),
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
  if (withCompetition && seKey) {
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

  // When winners are thin, surface the closest real products (some sold history,
  // best net) so a run is never an unhelpful blank — even if they currently sell
  // for less on eBay, they show the user the tool worked and what it found.
  const winnerAsins = new Set(winners.map((c) => c.asin));
  const nearMisses = deduped
    .filter((c) => !winnerAsins.has(c.asin) && c.soldCount >= 2)
    .sort((a, b) => b.net - a.net)
    .slice(0, 6);

  return { winners, nearMisses, scanned: deduped.length, seeds };
}
