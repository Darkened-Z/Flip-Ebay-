"use client";

import { useState } from "react";

export function TitleField({
  defaultValue,
  max = 80,
}: {
  defaultValue: string;
  max?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const count = value.length;
  const over = count > max;
  const counterColor = over ? "var(--color-cost)" : "var(--color-flip)";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Title</div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
            color: counterColor,
            padding: "4px 9px",
            borderRadius: 7,
            background: over ? "var(--color-cost-soft)" : "var(--color-go-soft)",
          }}
        >
          {count} / {max}
        </div>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          marginTop: 12,
          width: "100%",
          boxSizing: "border-box",
          border: `1px solid ${over ? "var(--color-cost)" : "var(--color-line)"}`,
          outline: "none",
          background: "var(--color-surface-2)",
          borderRadius: 12,
          padding: "13px 14px",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-ink)",
        }}
      />
    </div>
  );
}
