"use server";

import { runScan } from "@/lib/scan";
import { parseSource } from "@/lib/scan/mockProvider";
import { createClient } from "@/lib/supabase/server";
import type { ScanResult } from "@/lib/mockData";

export type ScanActionResult = ScanResult | { error: string };

export async function runScanAction(url: string): Promise<ScanActionResult> {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return { error: "Paste a product URL first." };

  let result: ScanResult;
  try {
    result = await runScan(trimmed);
  } catch {
    return { error: "Couldn't scan that URL — please try again." };
  }

  // Best-effort persistence for the signed-in user. Silently skips if Supabase
  // isn't configured, the user isn't logged in, or the table doesn't exist yet.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { source } = parseSource(result.source.url);
      const verdict =
        result.verdict.label === "Worth listing"
          ? "worth_listing"
          : result.verdict.label.toLowerCase();
      await supabase.from("scans").insert({
        user_id: user.id,
        source: source === "unknown" ? null : source,
        source_url: result.source.url,
        source_id: result.source.id,
        title: result.source.title,
        est_net: result.verdict.estimatedNet,
        margin_pct: result.verdict.marginPct,
        verdict,
        data: result,
      });
    }
  } catch {
    // ignore persistence errors
  }

  return result;
}
