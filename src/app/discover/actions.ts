"use server";

import { discover, type Candidate } from "@/lib/scan/discover";
import { runHunt } from "@/lib/sourcing/hunt";

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
  | { winners: Candidate[]; scanned: number; seeds: string[] }
  | { error: string };

export async function huntAction(
  seedCount: number,
): Promise<HuntActionResult> {
  const n = Math.min(8, Math.max(2, Math.round(seedCount) || 3));
  try {
    return await runHunt(n); // free-tier defaults: 1 page, no competition pass
  } catch {
    return { error: "Hunt failed — please try again." };
  }
}
