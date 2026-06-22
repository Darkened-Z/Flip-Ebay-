"use server";

import { createClient } from "@/lib/supabase/server";
import type { Candidate } from "@/lib/scan/discover";

export async function saveFinds(
  items: Candidate[],
): Promise<{ saved: number } | { error: string }> {
  if (!items?.length) return { error: "Nothing to save." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in first." };

    const rows = items
      .filter((c) => c.asin)
      .map((c) => ({
        user_id: user.id,
        asin: c.asin,
        title: c.title,
        image: c.image,
        link: c.link,
        amazon_price: c.amazonPrice,
        ebay_price: c.ebayPrice,
        sold_count: c.soldCount,
        net: c.net,
        margin_pct: c.marginPct,
        worth: c.worth,
      }));

    const { error } = await supabase
      .from("finds")
      .upsert(rows, { onConflict: "user_id,asin", ignoreDuplicates: true });
    if (error) return { error: error.message };
    return { saved: rows.length };
  } catch {
    return { error: "Could not save finds." };
  }
}
