import { AppHeader } from "@/components/brand";
import { getInventoryData, type InventoryAlert } from "@/lib/data/inventory";
import { refreshInventory } from "@/app/inventory/actions";
import { buildNav } from "@/lib/nav";
import { IconRefresh, IconShieldCheck, IconAlertTriangle } from "@tabler/icons-react";

function AlertRow({ a }: { a: InventoryAlert }) {
  const paused = a.severity === "paused";
  const badge = paused
    ? { bg: "var(--color-cost-soft)", fg: "var(--color-cost)", label: "PAUSED" }
    : { bg: "var(--color-amber-soft)", fg: "var(--color-amber-ink)", label: "REVIEW" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 0",
        borderTop: "1px solid var(--color-line)",
      }}
    >
      <span style={{ color: badge.fg, display: "inline-flex", flexShrink: 0 }}>
        <IconAlertTriangle size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>
        {a.message}
      </div>
      <span
        style={{
          flexShrink: 0,
          padding: "4px 9px",
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 700,
          background: badge.bg,
          color: badge.fg,
        }}
      >
        {badge.label}
      </span>
    </div>
  );
}

export default async function InventoryPage() {
  const { watching, alerts } = await getInventoryData();

  return (
    <main className="page">
      <AppHeader tagline="Inventory monitor" nav={buildNav("/inventory")} />

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 24,
          alignItems: "center",
          flexWrap: "wrap",
          background: "var(--color-surface)",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>
            Watching
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {watching}
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--color-line)", paddingLeft: 24 }}>
          <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>
            Open alerts
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: alerts.length ? "var(--color-cost)" : "var(--color-ink)",
            }}
          >
            {alerts.length}
          </div>
        </div>
        <form action={refreshInventory} style={{ marginLeft: "auto" }}>
          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "12px 20px",
              background: "var(--color-flip)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px -3px rgba(15,122,67,.5)",
            }}
          >
            <IconRefresh size={16} /> Refresh now
          </button>
        </form>
      </div>

      <div
        style={{
          marginTop: 14,
          background: "var(--color-surface)",
          borderRadius: 16,
          padding: "4px 18px 14px",
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        {alerts.length ? (
          alerts.map((a) => <AlertRow key={a.id} a={a} />)
        ) : (
          <div
            style={{
              padding: "40px 12px",
              textAlign: "center",
              color: "var(--color-muted)",
            }}
          >
            <span style={{ color: "var(--color-flip)", display: "inline-flex" }}>
              <IconShieldCheck size={28} />
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>
              {watching ? "All clear" : "Nothing to monitor yet"}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {watching
                ? "No issues on your active listings. Hit Refresh to re-check."
                : "Active listings show up here. Build and keep a listing active, then Refresh."}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "var(--color-faint)", lineHeight: 1.6 }}>
        On refresh, FLIP re-checks each active listing on Amazon and flags:
        out-of-stock (auto-pauses the listing), price up &gt;10% since you
        listed, or no longer shipping from Amazon.
      </div>
    </main>
  );
}
