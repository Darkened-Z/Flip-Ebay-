"use client";

import { useState } from "react";
import { IconSearch, IconBolt } from "@tabler/icons-react";

export function SearchBar({
  defaultValue = "",
  onScan,
  pending = false,
}: {
  defaultValue?: string;
  onScan?: (url: string) => void;
  pending?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  function go() {
    if (!pending) onScan?.(value);
  }

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
        onKeyDown={(e) => {
          if (e.key === "Enter") go();
        }}
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
        onClick={go}
        disabled={pending}
        style={{
          padding: "12px 24px",
          background: "var(--color-flip)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 700,
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        {pending ? "Scanning…" : <>Scan <IconBolt size={16} stroke={2} /></>}
      </button>
    </div>
  );
}
