import { StatCard } from "@/components/flip/StatCard";
import { SoldChart } from "@/components/flip/SoldChart";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import type { ScanResult } from "@/lib/mockData";
import {
  IconTruck,
  IconCircleCheck,
  IconShoppingBag,
  IconClockHour4,
  IconUsers,
  IconTrendingUp,
  IconCheck,
  IconShieldCheck,
  IconArrowRight,
  IconExternalLink,
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

function Mini({
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
        borderLeft: bordered ? "1px solid rgba(255,255,255,.22)" : "none",
        paddingLeft: bordered ? 18 : 0,
      }}
    >
      <div
        style={{ fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 600 }}
      >
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 1 }}>{value}</div>
    </div>
  );
}

function Row({ k, v, cost }: { k: string; v: string; cost?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        padding: "5px 0",
      }}
    >
      <span style={{ color: "var(--color-muted)" }}>{k}</span>
      <span
        style={{
          fontWeight: 600,
          color: cost ? "var(--color-cost)" : "var(--color-ink)",
        }}
      >
        {v}
      </span>
    </div>
  );
}

function Chk({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
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
        fontWeight: 600,
      }}
    >
      {icon} {label}
    </span>
  );
}

export function ScanResultView({
  result,
  onBuild,
  building,
}: {
  result: ScanResult;
  onBuild?: () => void;
  building?: boolean;
}) {
  const s = result;
  const todayIndex = s.velocity.bars.length - 4;
  const worth = s.verdict.label === "Worth listing";
  const amazonUrl =
    s.source.id && s.source.id !== "UNKNOWN"
      ? `https://www.amazon.com/dp/${s.source.id}`
      : s.source.url.startsWith("http")
        ? s.source.url
        : `https://${s.source.url}`;

  return (
    <>
      <div className="grid-verdict" style={{ marginTop: 18 }}>
        <div style={card}>
          <div style={{ display: "flex", gap: 14 }}>
            <ProductGlyph size={96} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                {s.source.title}
              </div>
              <div
                style={{ fontSize: 13, color: "var(--color-faint)", marginTop: 2 }}
              >
                {s.source.subtitle}
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 8,
                  padding: "4px 9px",
                  background: "var(--color-go-soft)",
                  color: "var(--color-flip)",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <IconTruck size={13} /> Ships from Amazon · Prime
              </span>
              <div style={{ marginTop: 8 }}>
                <a
                  href={amazonUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-flip)",
                    textDecoration: "none",
                  }}
                >
                  <IconExternalLink size={13} /> Open on Amazon
                </a>
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid var(--color-line)",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}
              >
                Amazon cost
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
                ${s.source.price.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}
              >
                List at
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
                ${s.pricing.list.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: worth ? "var(--color-flip)" : "var(--color-amber)",
            borderRadius: 16,
            padding: 20,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              "0 1px 3px rgba(0,0,0,.05), 0 16px 34px -16px rgba(15,122,67,.6)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
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
                textTransform: "uppercase",
              }}
            >
              <IconCircleCheck size={15} /> {s.verdict.label}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 13,
                color: "rgba(255,255,255,.85)",
                fontWeight: 500,
              }}
            >
              You make per unit
            </div>
            <div
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                marginTop: 2,
              }}
            >
              ${s.verdict.estimatedNet.toFixed(2)}
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
              <Mini label="MARGIN" value={`${s.verdict.marginPct}%`} />
              <Mini label="SELLS IN" value={`~${s.verdict.soldDays} days`} bordered />
              <Mini label="SOLD · 30D" value={`${s.verdict.soldCount}`} bordered />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-stats-4" style={{ marginTop: 14 }}>
        <StatCard
          icon={<IconShoppingBag size={16} />}
          label="Sold · 30d"
          value={s.velocity.sold}
        />
        <StatCard
          icon={<IconClockHour4 size={16} />}
          label="Avg days"
          value={s.velocity.avgDays}
        />
        <StatCard
          icon={<IconUsers size={16} />}
          label="Competitors"
          value={s.velocity.competitors}
        />
        <StatCard
          icon={<IconTrendingUp size={16} />}
          label="Sell-through"
          value={
            <>
              {s.velocity.sellThroughPct}
              <span style={{ fontSize: 16, color: "var(--color-faint)" }}>%</span>
            </>
          }
        />
      </div>

      <div className="grid-split" style={{ marginTop: 14 }}>
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>eBay sold history</div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "var(--color-bg)",
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-muted)",
              }}
            >
              Median ${s.velocity.median.toFixed(2)}
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <SoldChart bars={s.velocity.bars} todayIndex={todayIndex} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              fontSize: 11,
              color: "var(--color-faint)",
              fontWeight: 500,
            }}
          >
            <span>May 23</span>
            <span>Jun 6</span>
            <span>Jun 22</span>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Profit breakdown</div>
          <div style={{ marginTop: 14 }}>
            <Row k="List price" v={`$${s.pricing.list.toFixed(2)}`} />
            <Row k="Amazon cost" v={`−$${s.pricing.sourceCost.toFixed(2)}`} cost />
            <Row k="eBay fees 13%" v={`−$${s.pricing.fees.toFixed(2)}`} cost />
            <Row
              k="Shipping + tax"
              v={`−$${(s.pricing.shipping + s.pricing.tax).toFixed(2)}`}
              cost
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10,
                padding: "11px 13px",
                background: "var(--color-go-soft)",
                borderRadius: 11,
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 700, color: "var(--color-flip)" }}
              >
                Net profit
              </span>
              <span
                style={{ fontSize: 20, fontWeight: 800, color: "var(--color-flip)" }}
              >
                ${s.pricing.net.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Chk icon={<IconCheck size={14} />} label="Prime eligible" />
        <Chk icon={<IconCheck size={14} />} label="US seller · Buy It Now" />
        <Chk icon={<IconCheck size={14} />} label="Price stable 30 days" />
        <Chk icon={<IconShieldCheck size={14} />} label="Not restricted" />
      </div>

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button
          type="button"
          style={{ ...primaryBtn, opacity: building ? 0.7 : 1 }}
          onClick={onBuild}
          disabled={building}
        >
          {building ? (
            "Building…"
          ) : (
            <>
              Build listing <IconArrowRight size={17} />
            </>
          )}
        </button>
        <button type="button" style={ghostBtn}>
          Save for later
        </button>
        <button type="button" style={textBtn}>
          Skip
        </button>
      </div>
    </>
  );
}
