type SoldChartProps = {
  bars: number[];
  todayIndex: number;
};

export function SoldChart({ bars, todayIndex }: SoldChartProps) {
  return (
    <div
      style={{
        position: "relative",
        height: 96,
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
      }}
    >
      {bars.map((h, i) => {
        const today = i === todayIndex;
        const strong = h >= 70;
        const bg = today
          ? "var(--color-amber)"
          : strong
            ? "#5cb585"
            : "#cfe8d8";
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: bg,
              borderRadius: "3px 3px 0 0",
              position: "relative",
              boxShadow: today ? "0 0 16px -2px rgba(245,158,11,.55)" : "none",
            }}
          >
            {today ? (
              <div
                style={{
                  position: "absolute",
                  top: -22,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--color-amber)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                Today
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
