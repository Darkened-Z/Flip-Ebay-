"use server";

import { discover, type Candidate } from "@/lib/scan/discover";

export type DiscoverResult = { candidates: Candidate[] } | { error: string };

export async function discoverAction(
  term: string,
  limit: number,
): Promise<DiscoverResult> {
  const t = (term ?? "").trim();
  if (!t) return { error: "Type a product or category to search for." };
  const n = Math.min(12, Math.max(1, Math.round(limit) || 8));
  try {
    const candidates = await discover(t, n);
    return { candidates };
  } catch {
    return { error: "Search failed — please try again." };
  }
}
