import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingStatus } from "@/lib/listingsData";

type ListingRow = {
  id: string;
  title: string | null;
  source: string | null;
  source_id: string | null;
  sku: string | null;
  status: string | null;
  list_price: number | null;
  net_profit: number | null;
  views: number | null;
  product_variant: string | null;
  image_urls: string[] | null;
  created_at: string | null;
};

function toStatus(s: string | null): ListingStatus {
  return s === "sold" || s === "paused" ? s : "active";
}

// Returns the signed-in user's listings mapped to the UI shape, or [] when
// there are none / Supabase isn't configured / nobody is logged in.
export async function getUserListings(): Promise<Listing[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("listings")
      .select(
        "id,title,source,source_id,sku,status,list_price,net_profit,views,product_variant,image_urls,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (data ?? []) as ListingRow[];
    const now = Date.now();

    return rows.map((r) => ({
      id: r.id,
      title: r.title ?? "Untitled listing",
      source: r.source_id ?? r.source ?? "",
      sku: r.sku ?? "",
      status: toStatus(r.status),
      ageDays: r.created_at
        ? Math.max(0, Math.floor((now - new Date(r.created_at).getTime()) / 86_400_000))
        : 0,
      views: r.views ?? 0,
      listPrice: Number(r.list_price ?? 0),
      netProfit: r.net_profit != null ? Number(r.net_profit) : null,
      tone: "default",
      productVariant:
        r.product_variant === "alt-1" || r.product_variant === "alt-2"
          ? r.product_variant
          : "default",
      image: r.image_urls?.[0] ?? null,
    }));
  } catch {
    return [];
  }
}
