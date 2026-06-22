type WordmarkProps = {
  tagline?: string;
};

export function Wordmark({ tagline }: WordmarkProps) {
  return (
    <div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        FLIP
      </div>
      {tagline ? (
        <div
          style={{ fontSize: 11, color: "var(--color-faint)", marginTop: 2 }}
        >
          {tagline}
        </div>
      ) : null}
    </div>
  );
}
