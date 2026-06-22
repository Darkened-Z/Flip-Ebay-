"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/flip/SearchBar";
import { ScanResultView } from "@/components/scanner/ScanResultView";
import { runScanAction } from "@/app/scan/actions";
import { createDraftFromScan } from "@/app/builder/actions";
import type { ScanResult } from "@/lib/mockData";
import { IconAlertTriangle } from "@tabler/icons-react";

export function ScannerClient({
  initial,
  initialUrl,
}: {
  initial: ScanResult;
  initialUrl?: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ScanResult | null>(initial);
  const [pending, setPending] = useState(false);
  const [building, setBuilding] = useState(false);
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

  useEffect(() => {
    if (initialUrl) {
      void handleScan(initialUrl);
    }
    // run once on mount for a ?url= deep link from Discover
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuild() {
    if (!result) return;
    setBuilding(true);
    setError(null);
    const res = await createDraftFromScan(result);
    setBuilding(false);
    if ("id" in res) {
      router.push(`/builder?id=${res.id}`);
    } else {
      setError(res.error);
    }
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
        <ScanResultView
          result={result}
          onBuild={handleBuild}
          building={building}
        />
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
