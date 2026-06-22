import { AppHeader } from "@/components/brand";
import { StatsRow } from "@/components/listings/StatsRow";
import { ListingsTable } from "@/components/listings/ListingsTable";
import { getUserListings } from "@/lib/data/listings";
import { buildNav } from "@/lib/nav";
import { IconPackage } from "@tabler/icons-react";

export default async function ListingsPage() {
  const rows = await getUserListings();
  const active = rows.filter((l) => l.status === "active").length;
  const sold = rows.filter((l) => l.status === "sold").length;
  const netProfit = rows
    .filter((l) => l.status === "sold")
    .reduce((s, l) => s + (l.netProfit ?? 0), 0);

  return (
    <main className="page">
      <AppHeader tagline="Active listings" nav={buildNav("/listings")} />

      {rows.length === 0 ? (
        <div
          style={{
            marginTop: 20,
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--color-go-soft)",
              color: "var(--color-flip)",
              marginBottom: 14,
            }}
          >
            <IconPackage size={24} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No listings yet</div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              marginTop: 6,
              maxWidth: 360,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            Scan a product, then hit <b>Build listing</b> to save your first
            one. It&apos;ll show up here.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 20 }}>
            <StatsRow
              active={active}
              sold={sold}
              netProfit={netProfit}
              total={rows.length}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <ListingsTable listings={rows} />
          </div>

          <div
            style={{ marginTop: 16, fontSize: 12, color: "var(--color-faint)" }}
          >
            Showing {rows.length} listing{rows.length === 1 ? "" : "s"}
          </div>
        </>
      )}
    </main>
  );
}
