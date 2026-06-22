"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { discoverAction } from "@/app/discover/actions";
import type { Candidate } from "@/lib/scan/discover";
import type { SeasonalSuggestion } from "@/lib/sourcing/seasonal";
import {
  IconSearch,
  IconBolt,
  IconCircleCheck,
  IconArrowRight,
  IconCalendarEvent,
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

export function DiscoverClient({
  seasonal,
}: {
  seasonal: SeasonalSuggestion[];
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [limit, setLimit] = useState(8);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [related, setRelated] = useState<string[]>([]);

  async function run(override?: string) {
    const q = (override ?? term).trim();
    if (!q || pending) return;
    if (override) setTerm(override);
    setPending(true);
    setError(null);
    const res = await discoverAction(q, limit);
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setCandidates(res.candidates);
    setRelated(res.related);
  }

  return (
    <>
      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "var(--color-surface)",
          padding: "8px 8px 8px 16px",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <IconSearch size={19} color="#9a9ea4" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
          placeholder="Search a product or category, e.g. dog dental treats"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            color: "var(--color-ink)",
          }}
        />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{
            border: "1px solid var(--color-line)",
            borderRadius: 9,
            padding: "8px 10px",
            fontSize: 13,
            background: "var(--color-surface-2)",
            color: "var(--color-ink)",
          }}
        >
          {[5, 8, 10, 12].map((n) => (
            <option key={n} value={n}>
              {n} products
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => run()}
          disabled={pending}
          style={{
            padding: "12px 22px",
            background: "var(--color-flip)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
          }}
        >
          {pending ? "Finding…" : <>Find <IconBolt size={16} /></>}
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-faint)" }}>
        Ranked by eBay demand (sell velocity) × profit. Uses ~2 + N API lookups
        per search.
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
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
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

      {/* Related searches (eBay demand expansion) */}
      {related.length ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-muted)",
              marginBottom: 8,
            }}
          >
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
          Scanning products against eBay sold comps…
        </div>
      ) : candidates && candidates.length ? (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {candidates.map((c) => (
            <CandidateRow
              key={c.asin}
              c={c}
              onScan={() => router.push(`/?url=${encodeURIComponent(c.link)}`)}
            />
          ))}
        </div>
      ) : candidates ? (
        <div
          style={{
            marginTop: 18,
            padding: 40,
            textAlign: "center",
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            color: "var(--color-faint)",
          }}
        >
          No products found for that search. Try different words.
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
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-muted)",
          }}
        >
          Amazon ${c.amazonPrice.toFixed(2)} · eBay median $
          {c.ebayMedian.toFixed(2)} · {c.soldCount} sold
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
