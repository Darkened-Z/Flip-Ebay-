import { createClient } from "@/lib/supabase/server";

export type InventoryAlert = {
  id: string;
  title: string;
  type: string;
  message: string;
  severity: string; // 'paused' | 'review'
};

export type InventoryData = {
  watching: number;
  alerts: InventoryAlert[];
};

type AlertRow = {
  id: string;
  type: string | null;
  message: string | null;
  severity: string | null;
  listings: { title: string | null } | { title: string | null }[] | null;
};

export async function getInventoryData(): Promise<InventoryData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { watching: 0, alerts: [] };

    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    const { data } = await supabase
      .from("alerts")
      .select("id,type,message,severity,listings(title)")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (data ?? []) as unknown as AlertRow[];
    const alerts = rows.map((r) => {
      const l = Array.isArray(r.listings) ? r.listings[0] : r.listings;
      return {
        id: r.id,
        title: l?.title ?? "Listing",
        type: r.type ?? "",
        message: r.message ?? "",
        severity: r.severity ?? "review",
      };
    });

    return { watching: count ?? 0, alerts };
  } catch {
    return { watching: 0, alerts: [] };
  }
}
