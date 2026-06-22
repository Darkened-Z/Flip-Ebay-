import { createClient } from "@/lib/supabase/server";

export type FulfillOrder = {
  id: string;
  title: string;
  state: string; // new | ordered | shipped | closed
  net: number;
  sourceUrl: string;
  createdAt: string;
};

type ListingRel = { title: string | null } | { title: string | null }[] | null;
type OrderRow = {
  id: string;
  state: string | null;
  net: number | null;
  source_url: string | null;
  created_at: string | null;
  listings: ListingRel;
};

export async function getUserOrders(): Promise<FulfillOrder[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("orders")
      .select("id,state,net,source_url,created_at,listings(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const rows = (data ?? []) as unknown as OrderRow[];
    return rows.map((r) => {
      const l = Array.isArray(r.listings) ? r.listings[0] : r.listings;
      return {
        id: r.id,
        title: l?.title ?? "Order",
        state: r.state ?? "new",
        net: Number(r.net ?? 0),
        sourceUrl: r.source_url ?? "",
        createdAt: r.created_at ?? "",
      };
    });
  } catch {
    return [];
  }
}
