"use server";

import { runScan } from "@/lib/scan";
import { parseSource } from "@/lib/scan/mockProvider";
import { createClient } from "@/lib/supabase/server";
import type { ScanResult } from "@/lib/mockData";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ScanActionResult = ScanResult | { error: string };

const CACHE_TTL_HOURS = 24;

export async function runScanAction(url: string): Promise<ScanActionResult> {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return { error: "Paste a product URL first." };

  const { source, id: sourceId } = parseSource(trimmed);

  let supabase: SupabaseClient | null = null;
  let userId: string | null = null;
  try {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Supabase not configured — proceed without persistence/caching.
  }

  // Cache: reuse a recent scan of the same product for this user.
  if (supabase && userId && sourceId && sourceId !== "UNKNOWN") {
    try {
      const since = new Date(
        Date.now() - CACHE_TTL_HOURS * 3_600_000,
      ).toISOString();
      const { data } = await supabase
        .from("scans")
        .select("data")
        .eq("user_id", userId)
        .eq("source_id", sourceId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.data) return data.data as ScanResult;
    } catch {
      // ignore cache errors
    }
  }

  let result: ScanResult;
  try {
    result = await runScan(trimmed);
  } catch {
    return { error: "Couldn't scan that URL — please try again." };
  }

  if (supabase && userId) {
    try {
      const verdict =
        result.verdict.label === "Worth listing"
          ? "worth_listing"
          : result.verdict.label.toLowerCase();
      await supabase.from("scans").insert({
        user_id: userId,
        source: source === "unknown" ? null : source,
        source_url: result.source.url,
        source_id: result.source.id,
        title: result.source.title,
        est_net: result.verdict.estimatedNet,
        margin_pct: result.verdict.marginPct,
        verdict,
        data: result,
      });
    } catch {
      // ignore persistence errors
    }
  }

  return result;
}
