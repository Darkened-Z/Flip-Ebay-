import { AppHeader } from "@/components/brand";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import { TitleField } from "@/components/builder/TitleField";
import { builderData } from "@/lib/builderData";
import { buildNav } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { publishListing } from "@/app/builder/actions";
import {
  IconCircleCheck,
  IconPlus,
  IconArrowRight,
  IconAlertTriangle,
} from "@tabler/icons-react";

const card: React.CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 12px 28px -16px rgba(0,0,0,.12)",
};

const primaryBtn: React.CSSProperties = {
  padding: "14px 26px",
  background: "var(--color-flip)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 4px 14px -3px rgba(15,122,67,.5)",
};

const ghostBtn: React.CSSProperties = {
  padding: "14px 22px",
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  border: "1px solid var(--color-line)",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const textBtn: React.CSSProperties = {
  padding: "14px 22px",
  background: "transparent",
  color: "var(--color-faint)",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const cardTitle: React.CSSProperties = { fontSize: 14, fontWeight: 700 };

function KeywordChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      style={{
        padding: "7px 12px",
        background: "var(--color-bg)",
        color: "var(--color-muted)",
        border: "1px solid var(--color-line)",
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SpecLine({
  k,
  v,
  mono,
  required,
}: {
  k: string;
  v: string;
  mono?: boolean;
  required?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        padding: "8px 0",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span
        style={{
          color: required ? "var(--color-cost)" : "var(--color-muted)",
          fontWeight: required ? 700 : 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {required ? <IconAlertTriangle size={14} /> : null}
        {k}
      </span>
      {required ? (
        <span
          style={{
            padding: "4px 9px",
            background: "var(--color-cost-soft)",
            color: "var(--color-cost)",
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {v}
        </span>
      ) : (
        <span
          style={{
            fontWeight: 600,
            color: "var(--color-ink)",
            fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
            textAlign: "right",
          }}
        >
          {v}
        </span>
      )}
    </div>
  );
}

function SetupLine({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        padding: "8px 0",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span style={{ color: "var(--color-muted)", fontWeight: 500 }}>{k}</span>
      <span style={{ fontWeight: 600, color: "var(--color-ink)", textAlign: "right" }}>
        {v}
      </span>
    </div>
  );
}

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const d = builderData;
  const { id } = await searchParams;
  let anchor = d.anchor;
  let listingId = "";

  if (id) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("listings")
          .select("id,title,source_cost,list_price,net_profit")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          listingId = data.id as string;
          anchor = {
            title: (data.title as string) ?? d.anchor.title,
            sourcePrice: Number(data.source_cost ?? d.anchor.sourcePrice),
            listPrice: Number(data.list_price ?? d.anchor.listPrice),
            estNet: Number(data.net_profit ?? d.anchor.estNet),
          };
        }
      }
    } catch {
      // fall back to stub anchor
    }
  }

  return (
    <main className="page">
      <AppHeader tagline="Listing builder" nav={buildNav("/builder")} />

      {/* 1) Product anchor strip */}
      <div
        style={{
          ...card,
          marginTop: 20,
          padding: 15,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <ProductGlyph size={54} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{anchor.title}</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-muted)",
              marginTop: 3,
            }}
          >
            ${anchor.sourcePrice.toFixed(2)} source → $
            {anchor.listPrice.toFixed(2)} list · est. ${anchor.estNet.toFixed(2)}{" "}
            net
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: "var(--color-go-soft)",
            color: "var(--color-flip)",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <IconCircleCheck size={15} /> Worth listing
        </span>
      </div>

      {/* 2) Title section */}
      <div style={{ ...card, marginTop: 14 }}>
        <TitleField defaultValue={d.title.value} max={d.title.max} />
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-muted)",
              marginRight: 2,
            }}
          >
            From top comps:
          </span>
          {d.keywords.map((kw) => (
            <KeywordChip key={kw} label={kw} />
          ))}
        </div>
      </div>

      {/* 3) Images section */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={cardTitle}>
          Images ·{" "}
          <span style={{ color: "var(--color-muted)", fontWeight: 600 }}>
            {d.images.count} of {d.images.capacity}
          </span>
        </div>
        <div className="grid-images" style={{ marginTop: 14 }}>
          {d.images.variants.map((variant, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 12,
                overflow: "hidden",
                background: "#ebe7dd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ProductGlyph size={120} variant={variant} />
              {i === 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    left: 7,
                    padding: "3px 8px",
                    background: "var(--color-ink)",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  PRIMARY
                </span>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 12,
              border: "2px dashed var(--color-line)",
              background: "var(--color-surface-2)",
              color: "var(--color-muted)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <IconPlus size={20} />
            upload
          </button>
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--color-faint)",
            fontWeight: 500,
          }}
        >
          Pulled from {d.images.source} · drag to reorder · click to replace
        </div>
      </div>

      {/* 4) Two-column row */}
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div style={card}>
          <div style={cardTitle}>Item specifics</div>
          <div style={{ marginTop: 10 }}>
            {d.itemSpecifics.map((row) => (
              <SpecLine
                key={row.k}
                k={row.k}
                v={row.v}
                mono={row.mono}
                required={row.required}
              />
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>Listing setup</div>
          <div style={{ marginTop: 10 }}>
            {d.listingSetup.map((row) => (
              <SetupLine key={row.k} k={row.k} v={row.v} />
            ))}
          </div>
        </div>
      </div>

      {/* 5) Description template */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={cardTitle}>Description template</div>
        <div
          style={{
            marginTop: 12,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-line)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {d.description.heading}
          </div>
          <ul
            style={{
              margin: "12px 0 0",
              paddingLeft: 0,
              listStyle: "none",
              display: "grid",
              gap: 8,
            }}
          >
            {d.description.bullets.map((b) => (
              <li
                key={b}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--color-ink)",
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    color: "var(--color-flip)",
                    flexShrink: 0,
                    marginTop: 1,
                    display: "inline-flex",
                  }}
                >
                  <IconCircleCheck size={16} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid var(--color-line)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-muted)",
            }}
          >
            {d.description.appended}
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          {["Edit template", "Switch template", "Preview as buyer"].map((t) => (
            <button
              key={t}
              type="button"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                color: "var(--color-flip)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 6) Action bar */}
      <div className="btn-row" style={{ marginTop: 18 }}>
        <form action={publishListing} style={{ display: "contents" }}>
          <input type="hidden" name="id" value={listingId} />
          <button type="submit" style={primaryBtn}>
            Publish to eBay <IconArrowRight size={17} />
          </button>
        </form>
        <button type="button" style={ghostBtn}>
          Save draft
        </button>
        <button type="button" style={textBtn}>
          Preview
        </button>
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: "var(--color-cost-soft)",
            color: "var(--color-cost)",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <IconAlertTriangle size={15} /> {d.missingCount} specifics missing
        </span>
      </div>
    </main>
  );
}
