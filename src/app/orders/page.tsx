import { AppHeader } from "@/components/brand";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import { CopyAddress } from "@/components/orders/CopyAddress";
import {
  newOrder,
  orderSummary,
  progressOrders,
  type OrderState,
  type ProgressOrder,
} from "@/lib/ordersData";
import { buildNav } from "@/lib/nav";
import {
  IconExternalLink,
  IconBell,
  IconCircleDot,
  IconTruck,
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

const ghostBtnSmall: React.CSSProperties = {
  padding: "9px 16px",
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  border: "1px solid var(--color-line)",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const textBtn: React.CSSProperties = {
  padding: "14px 18px",
  background: "transparent",
  color: "var(--color-faint)",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
};

const STATE_BADGE: Record<OrderState, { bg: string; fg: string }> = {
  new: { bg: "var(--color-cost-soft)", fg: "var(--color-cost)" },
  ordered: { bg: "#ececea", fg: "var(--color-ink)" },
  shipped: { bg: "var(--color-go-soft)", fg: "var(--color-flip)" },
};

function StateBadge({
  state,
  label,
  ago,
}: {
  state: OrderState;
  label: string;
  ago: string;
}) {
  const s = STATE_BADGE[state];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.fg,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {label} · {ago}
    </span>
  );
}

function ProgressBar({ filled, total }: { filled: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: i < filled ? "var(--color-flip)" : "var(--color-line)",
          }}
        />
      ))}
    </div>
  );
}

function SummaryStat({
  label,
  count,
  dotColor,
  textColor,
}: {
  label: string;
  count: number;
  dotColor: string;
  textColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: textColor ?? "var(--color-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: textColor ?? "var(--color-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function SourceRow({
  k,
  v,
  green,
}: {
  k: string;
  v: string;
  green?: boolean;
}) {
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
          fontWeight: 700,
          color: green ? "var(--color-flip)" : "var(--color-ink)",
        }}
      >
        {v}
      </span>
    </div>
  );
}

function ProgressCard({ order }: { order: ProgressOrder }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 13 }}>
        <ProductGlyph size={52} variant={order.productVariant} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {order.title}
            </div>
            <StateBadge
              state={order.state}
              label={order.stateLabel}
              ago={order.agoLabel}
            />
          </div>
          <div
            style={{
              ...mono,
              fontSize: 11,
              color: "var(--color-faint)",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            {order.metaMono}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ProgressBar filled={order.progressFilled} total={order.progressTotal} />
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-muted)",
          }}
        >
          Step {order.progressFilled} of {order.progressTotal}
        </span>
        <button type="button" style={ghostBtnSmall}>
          {order.action}
        </button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const o = newOrder;
  const fullAddress = `${o.shipTo.name}\n${o.shipTo.line1}\n${o.shipTo.cityStateZip}\n${o.shipTo.country}`;

  return (
    <main className="page">
      <AppHeader tagline="Order fulfillment" nav={buildNav("/orders")} />

      {/* Summary band */}
      <div
        style={{
          ...card,
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-muted)",
              }}
            >
              Queue
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                marginTop: 2,
              }}
            >
              {orderSummary.queue}
            </div>
          </div>
          <div
            style={{
              height: 46,
              width: 1,
              background: "var(--color-line)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <SummaryStat
              label="New"
              count={orderSummary.countNew}
              dotColor="var(--color-cost)"
              textColor="var(--color-cost)"
            />
            <SummaryStat
              label="Ordered"
              count={orderSummary.countOrdered}
              dotColor="#9a9ea4"
            />
            <SummaryStat
              label="Shipped"
              count={orderSummary.countShipped}
              dotColor="var(--color-flip)"
              textColor="var(--color-flip)"
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "var(--color-go-soft)",
            borderRadius: 12,
          }}
        >
          <span style={{ color: "var(--color-flip)", display: "inline-flex" }}>
            <IconTruck size={18} />
          </span>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-flip)",
              }}
            >
              Net today
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--color-flip)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              ${orderSummary.netToday.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Needs action */}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ color: "var(--color-cost)", display: "inline-flex" }}>
          <IconBell size={16} />
        </span>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
          Needs action
        </h2>
      </div>

      <div style={card}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
            <ProductGlyph size={64} variant={o.productVariant} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}
              >
                {o.title}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 12,
                  color: "var(--color-faint)",
                  marginTop: 6,
                }}
              >
                eBay #{o.ebayId} · qty {o.qty} · ${o.received.toFixed(2)}{" "}
                received
              </div>
            </div>
          </div>
          <StateBadge state="new" label="NEW" ago={o.agoLabel} />
        </div>

        {/* Two columns */}
        <div
          className="grid-2"
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid var(--color-line)",
            gap: 0,
          }}
        >
          {/* Left: ship to */}
          <div style={{ paddingRight: 22 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-muted)",
                marginBottom: 8,
              }}
            >
              Ship to
            </div>
            <div
              style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}
            >
              {o.shipTo.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-ink)",
                marginTop: 3,
                lineHeight: 1.5,
              }}
            >
              {o.shipTo.line1}
              <br />
              {o.shipTo.cityStateZip}
              <br />
              {o.shipTo.country}
            </div>
            <CopyAddress address={fullAddress} />
          </div>

          {/* Right: source */}
          <div className="col-divider">
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-muted)",
                marginBottom: 8,
              }}
            >
              Source · {o.source.label}
            </div>
            <div
              style={{
                ...mono,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-ink)",
              }}
            >
              {o.source.url}
            </div>
            <div
              style={{
                marginTop: 10,
                paddingTop: 6,
                borderTop: "1px solid var(--color-line)",
              }}
            >
              <SourceRow k="Now" v={`$${o.source.now.toFixed(2)}`} />
              <SourceRow
                k="Margin locked"
                v={`$${o.source.marginLocked.toFixed(2)}`}
                green
              />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div
          className="btn-row"
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid var(--color-line)",
          }}
        >
          <button type="button" style={primaryBtn}>
            Open Amazon <IconExternalLink size={17} />
          </button>
          <button type="button" style={ghostBtn}>
            Mark ordered
          </button>
          <button type="button" style={textBtn}>
            Skip
          </button>
        </div>
      </div>

      {/* In progress */}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ color: "var(--color-flip)", display: "inline-flex" }}>
          <IconCircleDot size={16} />
        </span>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
          In progress
        </h2>
      </div>

      <div className="grid-2">
        {progressOrders.map((order) => (
          <ProgressCard key={order.ebayId} order={order} />
        ))}
      </div>
    </main>
  );
}
