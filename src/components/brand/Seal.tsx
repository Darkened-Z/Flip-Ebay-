type SealProps = {
  size?: number;
};

export function Seal({ size = 38 }: SealProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: "var(--color-flip)",
        color: "#fff",
        borderRadius: Math.round(size * 0.29),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: Math.round(size * 0.53),
        lineHeight: 1,
        boxShadow: "0 4px 12px -2px rgba(15,122,67,.45)",
      }}
    >
      F
    </div>
  );
}
