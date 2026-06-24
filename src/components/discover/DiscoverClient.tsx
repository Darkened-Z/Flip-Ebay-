"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { discoverAction, huntAction } from "@/app/discover/actions";
import { saveFinds } from "@/app/finds/actions";
import type { Candidate } from "@/lib/scan/discover";
import type { SeasonalSuggestion } from "@/lib/sourcing/seasonal";
import {
  IconSearch,
  IconBolt,
  IconCircleCheck,
  IconArrowRight,
  IconCalendarEvent,
  IconDownload,
  IconExternalLink,
  IconRadar2,
  IconBookmark,
} from "@tabler/icons-react";

const chip: React.CSSProperties = {
  padding: "6px 11px",
  background: "var(--color-surface)",
  border: "1px solid var(--color-line)",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-ink)",
  cursor: "pointer",
};

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
    "Prime",
    "Competition",
    "Worth Listing",
    "Source",
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
        c.isPrime ? "yes" : "no",
        c.competition ?? "",
        c.worth ? "yes" : "no",
        c.source ?? "",
      ].join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flip-finds-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DiscoverClient({
  seasonal,
}: {
  seasonal: SeasonalSuggestion[];
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [categories, setCategories] = useState(4);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [nearMisses, setNearMisses] = useState<Candidate[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  async function hunt() {
    if (pending) return;
    setPending(true);
    setError(null);
    setRelated([]);
    setInfo(null);
    setSaved(null);
    const res = await huntAction(categories);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setCandidates(res.winners);
    setNearMisses(res.nearMisses ?? []);
    if (res.saved > 0) setSaved(res.saved);
    setInfo(
      res.winners.length > 0
        ? `Found ${res.winners.length} winner${res.winners.length === 1 ? "" : "s"} from ${res.scanned} products${res.saved > 0 ? " · saved to your Finds tab" : ""}. Categories: ${res.seeds.join(", ")}`
        : `No profitable flips in ${res.scanned} products this run — these categories have little Amazon→eBay spread. Closest matches below. Categories: ${res.seeds.join(", ")}`,
    );
  }

  async function run(override?: string) {
    const q = (override ?? term).trim();
    if (!q || pending) return;
    if (override) setTerm(override);
    setPending(true);
    setError(null);
    setInfo(null);
    setSaved(null);
    const res = await discoverAction(q, 8);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setCandidates(res.candidates);
    setNearMisses([]);
    setRelated(res.related);
  }

  async function handleSave() {
    if (!candidates?.length) return;
    const res = await saveFinds(candidates);
    if ("saved" in res) setSaved(res.saved);
    else setError(res.error);
  }

  return (
    <>
      {/* Autonomous hunt — the main event */}
      <div
        style={{
          marginTop: 20,
          background: "var(--color-flip)",
          color: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 24px -10px rgba(15,122,67,.5)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <IconRadar2 size={20} /> Hunt products for me
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)", marginTop: 4, lineHeight: 1.5 }}>
            FLIP scans Amazon&apos;s deals and trending categories, and keeps
            only the ones selling higher on eBay. No searching needed.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={categories}
            onChange={(e) => setCategories(Number(e.target.value))}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 600,
              background: "rgba(255,255,255,.18)",
              color: "#fff",
            }}
          >
            {[2, 4, 6, 8].map((n) => (
              <option key={n} value={n} style={{ color: "#111" }}>
                {n} categories
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={hunt}
            disabled={pending}
            style={{
              padding: "12px 24px",
              background: "#fff",
              color: "var(--color-flip)",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 7,
              whiteSpace: "nowrap",
            }}
          >
            {pending ? "Hunting…" : <>Run hunt <IconBolt size={16} /></>}
          </button>
        </div>
      </div>

      {/* Manual search — secondary */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "var(--color-surface)",
          padding: "6px 6px 6px 14px",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <IconSearch size={17} color="#9a9ea4" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
          placeholder="…or search a specific product / category"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            color: "var(--color-ink)",
          }}
        />
        <button
          type="button"
          onClick={() => run()}
          disabled={pending}
          style={{
            padding: "9px 16px",
            background: "var(--color-surface-2)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
          }}
        >
          Search
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-faint)" }}>
        Ranked by profit × eBay demand. Leans on Amazon&apos;s deals feed, where
        the real spread is. Costs ~3 eBay lookups per category + the deals batch.
      </div>

      {/* Seasonal seeds */}
      {seasonal.length ? (
        <div
          style={{
            marginTop: 16,
            background: "var(--color-surface)",
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-muted)",
            }}
          >
            <IconCalendarEvent size={15} color="var(--color-flip)" /> Coming up — source ahead of demand
          </div>
          {seasonal.slice(0, 2).map((s) => (
            <div key={s.event} style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                {s.event}{" "}
                <span style={{ color: "var(--color-faint)", fontWeight: 600 }}>
                  · in {s.daysAway} day{s.daysAway === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {s.terms.map((t) => (
                  <button key={t} type="button" style={chip} onClick={() => run(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "var(--color-cost-soft)",
            color: "var(--color-cost)",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}

      {related.length ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted)", marginBottom: 8 }}>
            Buyers also search on eBay
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {related.map((r) => (
              <button key={r} type="button" style={chip} onClick={() => run(r)}>
                {r}
              </button>
            ))}
          </div>
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
            fontWeight: 600,
          }}
        >
          Hunting Amazon products and checking each against eBay sold comps…
        </div>
      ) : candidates && candidates.length ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}>
              {info ?? (
                <>
                  {candidates.length} products ·{" "}
                  <span style={{ color: "var(--color-flip)" }}>
                    {candidates.filter((c) => c.worth).length} worth listing
                  </span>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "var(--color-flip)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <IconBookmark size={15} />{" "}
                {saved === null ? "Save finds" : `Saved ${saved}`}
              </button>
              <button
                type="button"
                onClick={() => exportCsv(candidates)}
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {candidates.map((c) => (
              <CandidateRow
                key={c.asin}
                c={c}
                onScan={() => router.push(`/?url=${encodeURIComponent(c.link)}`)}
              />
            ))}
          </div>
        </div>
      ) : candidates ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-muted)",
              marginBottom: 10,
            }}
          >
            {info ?? "No profitable products found this run."}
          </div>
          {nearMisses.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nearMisses.map((c) => (
                <CandidateRow
                  key={c.asin}
                  c={c}
                  onScan={() => router.push(`/?url=${encodeURIComponent(c.link)}`)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                background: "var(--color-surface)",
                borderRadius: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,.05)",
                color: "var(--color-faint)",
                fontSize: 12,
              }}
            >
              Try more categories, or run again — FLIP explores different ground
              each time.
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

function CandidateRow({ c, onScan }: { c: Candidate; onScan: () => void }) {
  const netColor =
    c.net >= 5
      ? "var(--color-flip)"
      : c.net > 0
        ? "var(--color-amber-ink)"
        : "var(--color-cost)";
  const amazonUrl = c.link.startsWith("http") ? c.link : `https://${c.link}`;
  return (
    <div
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
          <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-muted)",
            }}
          >
            Amazon ${c.amazonPrice.toFixed(2)} · eBay ${c.ebayPrice.toFixed(2)} · {c.soldCount} sold/30d
            {c.competition != null ? ` · ${c.competition} competing` : ""}
            {c.shipsFromAmazon === true
              ? " · ✓ ships from Amazon"
              : c.shipsFromAmazon === false
                ? ` · ⚠ verify seller`
                : ""}
            {c.discounted ? " · ⚠ on sale (price may rise)" : ""}
          </span>
          {c.isPrime ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--color-flip)",
                background: "var(--color-go-soft)",
                padding: "1px 6px",
                borderRadius: 5,
              }}
            >
              Prime
            </span>
          ) : null}
          {c.source === "deal" ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--color-amber-ink)",
                background: "var(--color-amber-soft)",
                padding: "1px 6px",
                borderRadius: 5,
              }}
            >
              Deal
            </span>
          ) : null}
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
        <div style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 600 }}>Net</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: netColor, letterSpacing: "-0.02em" }}>
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
        onClick={onScan}
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
}
