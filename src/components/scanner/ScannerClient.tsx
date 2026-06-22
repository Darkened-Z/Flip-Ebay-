"use client";

import { useState } from "react";
import { SearchBar } from "@/components/flip/SearchBar";
import { ScanResultView } from "@/components/scanner/ScanResultView";
import { runScanAction } from "@/app/scan/actions";
import type { ScanResult } from "@/lib/mockData";
import { IconAlertTriangle } from "@tabler/icons-react";

export function ScannerClient({ initial }: { initial: ScanResult }) {
  const [result, setResult] = useState<ScanResult | null>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(url: string) {
    setPending(true);
    setError(null);
    const res = await runScanAction(url);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult(res);
  }

  return (
    <>
      <div style={{ marginTop: 20 }}>
        <SearchBar
          defaultValue={result?.source.url ?? ""}
          onScan={handleScan}
          pending={pending}
        />
      </div>

      {error ? (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            background: "var(--color-cost-soft)",
            color: "var(--color-cost)",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <IconAlertTriangle size={16} /> {error}
        </div>
      ) : null}

      {pending ? (
        <div
          style={{
            marginTop: 18,
            padding: 40,
            textAlign: "center",
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            color: "var(--color-muted)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Scanning…
        </div>
      ) : result ? (
        <ScanResultView result={result} />
      ) : (
        <div
          style={{
            marginTop: 18,
            padding: 48,
            textAlign: "center",
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            color: "var(--color-faint)",
            fontSize: 14,
          }}
        >
          Paste an Amazon or Sam&apos;s Club URL above and hit Scan.
        </div>
      )}
    </>
  );
}
