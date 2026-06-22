"use client";

import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/scan/discover";
import {
  IconDownload,
  IconArrowRight,
  IconCircleCheck,
  IconExternalLink,
  IconBookmark,
} from "@tabler/icons-react";

function exportCsv(rows: Candidate[]) {
  const headers = [
    "Title",
    "ASIN",
    "Amazon URL",
    "Amazon Price",
    "eBay Price",
    "Sold (30d)",
    "Net Profit",
    "Margin %",
    "Worth Listing",
  ];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const c of rows) {
    lines.push(
      [
        esc(c.title),
        c.asin,
        esc(c.link),
        c.amazonPrice.toFixed(2),
        c.ebayPrice.toFixed(2),
        c.soldCount,
        c.net.toFixed(2),
        c.marginPct,
        c.worth ? "yes" : "no",
      ].join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flip-saved-finds-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FindsClient({ finds }: { finds: Candidate[] }) {
  const router = useRouter();

  if (!finds.length) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: "48px 24px",
          textAlign: "center",
          background: "var(--color-surface)",
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--color-go-soft)",
            color: "var(--color-flip)",
            marginBottom: 14,
          }}
        >
          <IconBookmark size={24} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>No saved finds yet</div>
        <div
          style={{
            fontSize: 13,
            color: "var(--color-muted)",
            marginTop: 6,
            maxWidth: 360,
            margin: "6px auto 0",
            lineHeight: 1.5,
          }}
        >
          Run a hunt on Discover, then hit <b>Save finds</b> to collect the
          winners here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}>
          {finds.length} saved ·{" "}
          <span style={{ color: "var(--color-flip)" }}>
            {finds.filter((c) => c.worth).length} worth listing
          </span>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(finds)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <IconDownload size={15} /> Export CSV
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {finds.map((c) => {
          const netColor =
            c.net >= 5
              ? "var(--color-flip)"
              : c.net > 0
                ? "var(--color-amber-ink)"
                : "var(--color-cost)";
          const amazonUrl = c.link.startsWith("http") ? c.link : `https://${c.link}`;
          return (
            <div
              key={c.asin}
              style={{
                background: "var(--color-surface)",
                borderRadius: 14,
                padding: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,.05)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: "#ebe7dd",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : null}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-muted)",
                    }}
                  >
                    Amazon ${c.amazonPrice.toFixed(2)} · eBay ${c.ebayPrice.toFixed(2)} · {c.soldCount} sold
                  </span>
                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-muted)",
                      textDecoration: "none",
                    }}
                  >
                    <IconExternalLink size={12} /> Amazon
                  </a>
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 600 }}>
                  Net
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: netColor,
                    letterSpacing: "-0.02em",
                  }}
                >
                  ${c.net.toFixed(2)}
                </div>
              </div>

              {c.worth ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "var(--color-go-soft)",
                    color: "var(--color-flip)",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  <IconCircleCheck size={13} /> Worth it
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => router.push(`/?url=${encodeURIComponent(c.link)}`)}
                style={{
                  padding: "10px 16px",
                  background: "var(--color-ink)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                Scan <IconArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
