type Tone = "active" | "sold" | "paused" | "review";

const MAP: Record<Tone, { bg: string; fg: string }> = {
  active: { bg: "#ececea", fg: "#181a1f" },
  sold: { bg: "var(--color-go-soft)", fg: "var(--color-flip)" },
  paused: { bg: "var(--color-cost-soft)", fg: "var(--color-cost)" },
  review: { bg: "var(--color-amber-soft)", fg: "var(--color-amber-ink)" },
};

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const s = MAP[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 9px",
        borderRadius: 7,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.fg,
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}
