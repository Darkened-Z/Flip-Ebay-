import { createClient } from "@/lib/supabase/server";
import type { Candidate } from "@/lib/scan/discover";

type FindRow = {
  asin: string | null;
  title: string | null;
  image: string | null;
  link: string | null;
  amazon_price: number | null;
  ebay_price: number | null;
  sold_count: number | null;
  net: number | null;
  margin_pct: number | null;
  worth: boolean | null;
};

export async function getUserFinds(): Promise<Candidate[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("finds")
      .select(
        "asin,title,image,link,amazon_price,ebay_price,sold_count,net,margin_pct,worth",
      )
      .eq("user_id", user.id)
      .order("net", { ascending: false })
      .limit(200);

    const rows = (data ?? []) as FindRow[];
    return rows.map((r) => ({
      asin: r.asin ?? "",
      title: r.title ?? "Untitled",
      image: r.image,
      link: r.link ?? (r.asin ? `amazon.com/dp/${r.asin}` : ""),
      amazonPrice: Number(r.amazon_price ?? 0),
      ebayPrice: Number(r.ebay_price ?? 0),
      soldCount: r.sold_count ?? 0,
      net: Number(r.net ?? 0),
      marginPct: r.margin_pct ?? 0,
      isPrime: false,
      worth: !!r.worth,
    }));
  } catch {
    return [];
  }
}
