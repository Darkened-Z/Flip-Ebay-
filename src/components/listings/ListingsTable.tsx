import { StatusPill } from "@/components/brand";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import type { Listing, ListingStatus, ListingTone } from "@/lib/listingsData";

const ROW_TINT: Record<ListingTone, string> = {
  default: "transparent",
  warn: "var(--color-amber-soft)",
  alert: "var(--color-cost-soft)",
};

const NOTE_COLOR: Record<ListingTone, string> = {
  default: "var(--color-faint)",
  warn: "var(--color-amber-ink)",
  alert: "var(--color-cost)",
};

function pillTone(status: ListingStatus) {
  if (status === "sold") return "sold" as const;
  if (status === "paused") return "paused" as const;
  return "active" as const;
}

const th: React.CSSProperties = {
  padding: "12px 8px",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.04em",
};

export function ListingsTable({ listings }: { listings: Listing[] }) {
  return (
    <div
      className="table-scroll"
      style={{
        marginTop: 14,
        background: "var(--color-surface)",
        borderRadius: 16,
        padding: "4px 18px 14px",
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 560,
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", color: "var(--color-faint)" }}>
            <th style={{ ...th, width: 44, paddingLeft: 0 }} />
            <th style={th}>TITLE</th>
            <th style={{ ...th, width: 72 }}>STATUS</th>
            <th style={{ ...th, width: 52, textAlign: "right" }}>AGE</th>
            <th style={{ ...th, width: 58, textAlign: "right" }}>VIEWS</th>
            <th style={{ ...th, width: 66, textAlign: "right" }}>LIST</th>
            <th style={{ ...th, width: 66, textAlign: "right", paddingRight: 0 }}>
              NET
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr
              key={l.id}
              style={{
                borderTop: "1px solid var(--color-line)",
                background: ROW_TINT[l.tone],
              }}
            >
              <td style={{ padding: "10px 8px 10px 0" }}>
                <ProductGlyph
                  size={34}
                  variant={l.productVariant ?? "default"}
                />
              </td>
              <td style={{ padding: "10px 8px" }}>
                <div style={{ fontWeight: 600 }}>{l.title}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: NOTE_COLOR[l.tone],
                    marginTop: 1,
                    fontFamily: l.note ? "var(--font-sans)" : "var(--font-mono)",
                    fontWeight: l.note ? 600 : 400,
                  }}
                >
                  {l.note ?? `${l.source} · ${l.sku}`}
                </div>
              </td>
              <td style={{ padding: "10px 8px" }}>
                <StatusPill
                  label={l.status.toUpperCase()}
                  tone={pillTone(l.status)}
                />
              </td>
              <td
                style={{
                  padding: "10px 8px",
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-muted)",
                }}
              >
                {l.ageDays}d
              </td>
              <td
                style={{
                  padding: "10px 8px",
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-muted)",
                }}
              >
                {l.views}
              </td>
              <td
                style={{
                  padding: "10px 8px",
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                ${l.listPrice.toFixed(2)}
              </td>
              <td
                style={{
                  padding: "10px 0 10px 8px",
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color:
                    l.netProfit === null
                      ? "var(--color-faint)"
                      : l.status === "sold"
                        ? "var(--color-flip)"
                        : l.tone === "warn"
                          ? "var(--color-amber-ink)"
                          : "var(--color-ink)",
                }}
              >
                {l.netProfit === null ? "—" : `$${l.netProfit.toFixed(2)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
