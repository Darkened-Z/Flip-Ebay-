"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseSource } from "@/lib/scan/mockProvider";
import type { ScanResult } from "@/lib/mockData";

// Creates a draft listing from a scan and returns its id (for /builder?id=).
export async function createDraftFromScan(
  scan: ScanResult,
): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in first." };

    const { source } = parseSource(scan.source.url);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        title: scan.source.title,
        source: source === "unknown" ? null : source,
        source_id: scan.source.id,
        status: "draft",
        list_price: scan.pricing.list,
        source_cost: scan.pricing.sourceCost,
        net_profit: scan.pricing.net,
        quantity: 1,
        image_urls: scan.source.image ? [scan.source.image] : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Could not create the listing." };
    }
    return { id: data.id as string };
  } catch {
    return { error: "Could not create the listing." };
  }
}

// Publishes a draft listing (status → active) and returns to /listings.
export async function publishListing(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/listings");
  redirect("/listings");
}
