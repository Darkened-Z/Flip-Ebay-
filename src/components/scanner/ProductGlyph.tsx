type ProductGlyphProps = {
  size?: number;
  variant?: "default" | "alt-1" | "alt-2";
};

const VARIANTS = {
  default: { stripe: "#16a34a" },
  "alt-1": { stripe: "#52565c" },
  "alt-2": { stripe: "#16a34a" },
};

export function ProductGlyph({
  size = 96,
  variant = "default",
}: ProductGlyphProps) {
  const { stripe } = VARIANTS[variant];
  const pad = Math.round(size * 0.14);
  const radius = Math.max(6, Math.round(size * 0.13));
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "#ebe7dd",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#23262b",
          borderRadius: Math.max(3, Math.round(size * 0.06)),
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "16%",
            left: "20%",
            right: "20%",
            height: "9%",
            background: stripe,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "22%",
            left: "20%",
            right: "20%",
            height: "4%",
            background: "#3a3d42",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "14%",
            left: "20%",
            right: "20%",
            height: "4%",
            background: "#3a3d42",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}
