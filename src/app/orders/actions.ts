"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Mark a listing sold → flip it to sold and open an order to fulfill.
export async function markSold(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: listing } = await supabase
    .from("listings")
    .select("id,source_id,net_profit")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!listing) return;

  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", id)
    .eq("user_id", user.id);

  const sourceUrl = listing.source_id
    ? `https://www.amazon.com/dp/${listing.source_id}`
    : null;

  await supabase.from("orders").insert({
    user_id: user.id,
    listing_id: listing.id,
    state: "new",
    source_url: sourceUrl,
    net: listing.net_profit,
  });

  revalidatePath("/orders");
  revalidatePath("/listings");
}

const NEXT_STATE: Record<string, string> = {
  new: "ordered",
  ordered: "shipped",
  shipped: "closed",
};

export async function advanceOrder(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const cur = String(formData.get("state") ?? "");
  const next = NEXT_STATE[cur];
  if (!id || !next) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("orders")
    .update({ state: next })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/orders");
}
