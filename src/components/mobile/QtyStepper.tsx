"use client";

import { useState } from "react";
import { IconMinus, IconPlus } from "@tabler/icons-react";

type QtyStepperProps = {
  defaultQty?: number;
  netPerUnit: number;
  min?: number;
  max?: number;
};

export function QtyStepper({
  defaultQty = 6,
  netPerUnit,
  min = 1,
  max = 99,
}: QtyStepperProps) {
  const [qty, setQty] = useState(defaultQty);
  const cartNet = qty * netPerUnit;

  const stepBtn: React.CSSProperties = {
    width: 40,
    height: 40,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    border: "1px solid var(--color-line)",
    borderRadius: 11,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: 12,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-line)",
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(min, q - 1))}
          style={{ ...stepBtn, opacity: qty <= min ? 0.4 : 1 }}
        >
          <IconMinus size={17} />
        </button>
        <div
          style={{
            minWidth: 34,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {qty}
        </div>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          style={{ ...stepBtn, opacity: qty >= max ? 0.4 : 1 }}
        >
          <IconPlus size={17} />
        </button>
      </div>

      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-muted)",
          }}
        >
          Cart net
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--color-flip)",
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${cartNet.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
