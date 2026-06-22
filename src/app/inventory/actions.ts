"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const RAINFOREST = "https://api.rainforestapi.com/request";

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}

type ListingRow = {
  id: string;
  title: string | null;
  source_id: string | null;
  source_cost: number | null;
};

// Re-check each active listing's Amazon product: out of stock, price jump, or
// no longer ships-from-Amazon → write an alert (and pause on OOS).
export async function refreshInventory(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Clear previous auto-generated open alerts so we don't duplicate.
  await supabase.from("alerts").delete().eq("user_id", user.id).eq("status", "open");

  const { data } = await supabase
    .from("listings")
    .select("id,title,source_id,source_cost")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(40);
  const listings = (data ?? []) as ListingRow[];

  const rfKey = process.env.RAINFOREST_API_KEY;
  if (!rfKey || !listings.length) {
    revalidatePath("/inventory");
    return;
  }

  for (const l of listings) {
    if (!l.source_id) continue;
    try {
      const d = await getJson(
        `${RAINFOREST}?api_key=${rfKey}&type=product&amazon_domain=amazon.com&asin=${encodeURIComponent(l.source_id)}`,
      );
      const product = (d.product ?? {}) as Record<string, unknown>;
      const buybox = (product.buybox_winner ?? {}) as Record<string, unknown>;
      const priceObj = buybox.price as { value?: number } | undefined;
      const price = typeof priceObj?.value === "number" ? priceObj.value : null;
      const fulfillment = buybox.fulfillment as
        | { is_fulfilled_by_amazon?: boolean }
        | undefined;
      const cost = Number(l.source_cost ?? 0);

      if (price === null) {
        await supabase.from("alerts").insert({
          user_id: user.id,
          listing_id: l.id,
          type: "oos",
          message: `${l.title ?? "Listing"}: Amazon out of stock — paused`,
          severity: "paused",
          status: "open",
        });
        await supabase
          .from("listings")
          .update({ status: "paused" })
          .eq("id", l.id)
          .eq("user_id", user.id);
      } else if (cost > 0 && price > cost * 1.1) {
        await supabase.from("alerts").insert({
          user_id: user.id,
          listing_id: l.id,
          type: "price_jump",
          message: `${l.title ?? "Listing"}: Amazon price up $${cost.toFixed(2)} → $${price.toFixed(2)}`,
          severity: "review",
          status: "open",
        });
      } else if (fulfillment?.is_fulfilled_by_amazon === false) {
        await supabase.from("alerts").insert({
          user_id: user.id,
          listing_id: l.id,
          type: "not_amazon",
          message: `${l.title ?? "Listing"}: no longer ships from Amazon`,
          severity: "review",
          status: "open",
        });
      }
    } catch {
      // skip this listing on error
    }
  }

  revalidatePath("/inventory");
}
