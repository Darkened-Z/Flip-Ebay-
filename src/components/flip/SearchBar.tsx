"use client";

import { useState } from "react";
import { IconSearch, IconBolt } from "@tabler/icons-react";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        background: "var(--color-surface)",
        padding: "8px 8px 8px 16px",
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      }}
    >
      <IconSearch size={19} stroke={2} color="#9a9ea4" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste an Amazon or Sam's Club URL"
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--color-ink)",
        }}
      />
      <button
        type="button"
        style={{
          padding: "12px 24px",
          background: "var(--color-flip)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 7,
          boxShadow: "0 4px 12px -2px rgba(15,122,67,.45)",
        }}
      >
        Scan <IconBolt size={16} stroke={2} />
      </button>
    </div>
  );
}
