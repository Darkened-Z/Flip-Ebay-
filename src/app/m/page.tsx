import { Seal } from "@/components/brand";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { mobileScan } from "@/lib/mobileScanData";
import {
  IconCircleCheck,
  IconCheck,
  IconAlertTriangle,
  IconSearch,
  IconShoppingBag,
  IconList,
  IconUser,
} from "@tabler/icons-react";

const mono = "var(--font-mono)";

function StoreChip({ name, number }: { name: string; number: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 9px",
        background: "var(--color-go-soft)",
        borderRadius: 8,
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--color-flip)",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--color-flip-bright)",
          flexShrink: 0,
        }}
      />
      {name} {number}
    </div>
  );
}

function StatCell({
  label,
  value,
  bordered,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        borderLeft: bordered ? "1px solid var(--color-line)" : "none",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CheckLine({ label, tone }: { label: string; tone: "ok" | "warn" }) {
  const ok = tone === "ok";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: ok ? "var(--color-go-soft)" : "var(--color-amber-soft)",
        borderRadius: 11,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          color: ok ? "var(--color-flip)" : "var(--color-amber-ink)",
          flexShrink: 0,
        }}
      >
        {ok ? <IconCheck size={17} /> : <IconAlertTriangle size={17} />}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: ok ? "var(--color-flip)" : "var(--color-amber-ink)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Tab({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        color: active ? "var(--color-ink)" : "var(--color-faint)",
      }}
    >
      <span style={{ display: "inline-flex" }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 600 }}>{label}</span>
    </div>
  );
}

export default function MobileScannerPage() {
  const s = mobileScan;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 22,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          background: "var(--color-surface)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow:
            "0 1px 3px rgba(0,0,0,.06), 0 24px 50px -22px rgba(0,0,0,.30)",
        }}
      >
        {/* 1. App header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Seal size={28} />
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              FLIP
            </span>
          </div>
          <StoreChip name={s.store.name} number={s.store.number} />
        </div>

        {/* Scrollable body */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 2. Source card */}
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: 16,
              padding: 16,
              boxShadow:
                "0 1px 3px rgba(0,0,0,.05), 0 12px 28px -16px rgba(0,0,0,.12)",
              display: "flex",
              gap: 13,
            }}
          >
            <ProductGlyph size={70} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                {s.product.title}
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: "var(--color-faint)",
                  marginTop: 5,
                  lineHeight: 1.4,
                }}
              >
                UPC {s.product.upc} · {s.product.sku}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  ${s.product.price.toFixed(2)}
                </span>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--color-muted)",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-line)",
                    borderRadius: 6,
                    padding: "2px 6px",
                  }}
                >
                  {s.product.inClubNote}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Verdict block */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: "var(--color-flip)",
              color: "#fff",
              borderRadius: 16,
              padding: 18,
              boxShadow:
                "0 1px 3px rgba(0,0,0,.05), 0 16px 34px -16px rgba(15,122,67,.6)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -42,
                right: -42,
                width: 150,
                height: 150,
                background: "rgba(255,255,255,.10)",
                borderRadius: "50%",
              }}
            />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 12px",
                  background: "rgba(255,255,255,.18)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <IconCircleCheck size={15} /> WORTH IT
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,.85)",
                }}
              >
                You make per unit
              </div>
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 800,
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  marginTop: 3,
                }}
              >
                ${s.verdict.netPerUnit.toFixed(2)}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.9)",
                }}
              >
                ≈ {s.verdict.marginPct}% margin · sells in ~{s.verdict.soldDays} days
              </div>
            </div>
          </div>

          {/* 4. Stats row */}
          <div
            style={{
              display: "flex",
              background: "var(--color-surface)",
              borderRadius: 14,
              padding: "14px 6px",
              boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            }}
          >
            <StatCell label="Sold" value={String(s.stats.sold)} />
            <StatCell label="Median" value={`$${s.stats.median}`} bordered />
            <StatCell label="Days" value={s.stats.days.toFixed(1)} bordered />
          </div>

          {/* 5. Checks list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.checks.map((c) => (
              <CheckLine key={c.label} label={c.label} tone={c.tone} />
            ))}
          </div>

          {/* 6. Buy bar — quantity stepper (client) */}
          <QtyStepper
            defaultQty={s.cart.defaultQty}
            netPerUnit={s.verdict.netPerUnit}
          />

          {/* 7. Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "14px 20px",
                background: "var(--color-flip)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px -3px rgba(15,122,67,.5)",
              }}
            >
              <IconShoppingBag size={17} /> Add to cart
            </button>
            <button
              type="button"
              style={{
                padding: "14px 22px",
                background: "var(--color-surface)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* 8. Bottom tab bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "11px 8px",
            borderTop: "1px solid var(--color-line)",
            background: "var(--color-surface-2)",
          }}
        >
          <Tab icon={<IconSearch size={21} />} label="Scan" active />
          <Tab icon={<IconShoppingBag size={21} />} label={`Cart · ${s.cart.tabCount}`} />
          <Tab icon={<IconList size={21} />} label="List" />
          <Tab icon={<IconUser size={21} />} label="Me" />
        </div>
      </div>
    </main>
  );
}
