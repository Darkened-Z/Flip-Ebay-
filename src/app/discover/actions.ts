"use server";

import { discover, type Candidate } from "@/lib/scan/discover";
import { runHunt } from "@/lib/sourcing/hunt";
import { saveFinds } from "@/app/finds/actions";

export type DiscoverResult =
  | { candidates: Candidate[]; related: string[] }
  | { error: string };

export async function discoverAction(
  term: string,
  limit: number,
): Promise<DiscoverResult> {
  const t = (term ?? "").trim();
  if (!t) return { error: "Type a product or category to search for." };
  const n = Math.min(12, Math.max(1, Math.round(limit) || 8));
  try {
    const { candidates, related } = await discover(t, n);
    return { candidates, related };
  } catch {
    return { error: "Search failed — please try again." };
  }
}

export type HuntActionResult =
  | { winners: Candidate[]; scanned: number; seeds: string[]; saved: number }
  | { error: string };

export async function huntAction(
  seedCount: number,
): Promise<HuntActionResult> {
  const n = Math.min(8, Math.max(2, Math.round(seedCount) || 3));
  try {
    const result = await runHunt(n); // free-tier defaults: 1 page, no competition pass
    // Auto-save the winners to the Finds tab so they're there to list later.
    // Idempotent (upsert ignores duplicates), so re-runs won't pile up dupes.
    const res = await saveFinds(result.winners);
    const saved = "saved" in res ? res.saved : 0;
    return { ...result, saved };
  } catch {
    return { error: "Hunt failed — please try again." };
  }
}
