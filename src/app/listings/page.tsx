import { AppHeader } from "@/components/brand";
import { StatsRow } from "@/components/listings/StatsRow";
import { FilterChips } from "@/components/listings/FilterChips";
import { ListingsTable } from "@/components/listings/ListingsTable";
import { dashboardSummary, listings } from "@/lib/listingsData";
import { getUserListings } from "@/lib/data/listings";
import { buildNav } from "@/lib/nav";

const pageBtn = (active?: boolean, muted?: boolean): React.CSSProperties => ({
  padding: "6px 11px",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  background: active ? "var(--color-ink)" : "var(--color-surface)",
  color: active
    ? "#fff"
    : muted
      ? "var(--color-faint)"
      : "var(--color-ink)",
  boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,.05)",
});

export default async function ListingsPage() {
  const real = await getUserListings();
  const rows = real.length ? real : listings;
  return (
    <main className="page">
      <AppHeader tagline="Active listings" nav={buildNav("/listings")} />

      <div style={{ marginTop: 20 }}>
        <StatsRow summary={dashboardSummary} />
      </div>

      <FilterChips />

      <ListingsTable listings={rows} />

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-faint)" }}>
          Showing 1–8 of 47
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={pageBtn(false, true)}>‹ prev</span>
          <span style={pageBtn(true)}>1</span>
          <span style={pageBtn()}>2</span>
          <span style={pageBtn()}>3</span>
          <span style={pageBtn()}>next ›</span>
        </div>
      </div>
    </main>
  );
}
