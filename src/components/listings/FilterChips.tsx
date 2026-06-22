import { IconSearch } from "@tabler/icons-react";

type Chip = { label: string; count: number; active?: boolean; tone?: "cost" };

const CHIPS: Chip[] = [
  { label: "All", count: 47, active: true },
  { label: "Active", count: 39 },
  { label: "Sold", count: 6 },
  { label: "Paused", count: 2 },
  { label: "Alerts", count: 5, tone: "cost" },
];

export function FilterChips() {
  return (
    <div
      style={{
        marginTop: 18,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {CHIPS.map((c) => {
        const style: React.CSSProperties = c.active
          ? { background: "var(--color-ink)", color: "#fff" }
          : c.tone === "cost"
            ? { background: "var(--color-cost-soft)", color: "var(--color-cost)" }
            : {
                background: "var(--color-surface)",
                color: "var(--color-muted)",
                boxShadow: "0 1px 3px rgba(0,0,0,.05)",
              };
        return (
          <span
            key={c.label}
            style={{
              padding: "7px 13px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              ...style,
            }}
          >
            {c.label} · {c.count}
          </span>
        );
      })}
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--color-surface)",
          padding: "7px 12px",
          borderRadius: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <IconSearch size={15} color="#9a9ea4" />
        <input
          placeholder="Search title or SKU"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            width: 150,
            color: "var(--color-ink)",
          }}
        />
      </div>
    </div>
  );
}
