type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  accent?: string;
  sublabelColor?: string;
};

export function StatCard({
  icon,
  label,
  value,
  sublabel,
  accent = "var(--color-flip)",
  sublabelColor = "var(--color-faint)",
}: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: 14,
        padding: 15,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "var(--color-muted)",
        }}
      >
        <span style={{ color: accent, display: "inline-flex" }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 8,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sublabel ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: sublabelColor,
            marginTop: 4,
          }}
        >
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}
