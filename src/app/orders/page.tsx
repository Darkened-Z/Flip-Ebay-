import { AppHeader } from "@/components/brand";
import { getUserOrders, type FulfillOrder } from "@/lib/data/orders";
import { advanceOrder } from "@/app/orders/actions";
import { buildNav } from "@/lib/nav";
import { IconExternalLink, IconPackage } from "@tabler/icons-react";

const STATE_LABEL: Record<string, string> = {
  new: "New",
  ordered: "Ordered",
  shipped: "Shipped",
  closed: "Done",
};
const NEXT_LABEL: Record<string, string> = {
  new: "Mark ordered",
  ordered: "Mark shipped",
  shipped: "Mark done",
};

function badgeStyle(state: string): React.CSSProperties {
  const map: Record<string, { bg: string; fg: string }> = {
    new: { bg: "var(--color-cost-soft)", fg: "var(--color-cost)" },
    ordered: { bg: "#ececea", fg: "var(--color-ink)" },
    shipped: { bg: "var(--color-go-soft)", fg: "var(--color-flip)" },
    closed: { bg: "#eceae4", fg: "var(--color-muted)" },
  };
  const s = map[state] ?? map.new;
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    background: s.bg,
    color: s.fg,
  };
}

function OrderCard({ o }: { o: FulfillOrder }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
          {o.title}
        </div>
        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={badgeStyle(o.state)}>
            {STATE_LABEL[o.state] ?? o.state}
          </span>
          {o.sourceUrl ? (
            <a
              href={o.sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-flip)",
                textDecoration: "none",
              }}
            >
              <IconExternalLink size={13} /> Order on Amazon
            </a>
          ) : null}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 600 }}>
          Net
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--color-flip)",
            letterSpacing: "-0.02em",
          }}
        >
          ${o.net.toFixed(2)}
        </div>
      </div>

      {o.state !== "closed" ? (
        <form action={advanceOrder}>
          <input type="hidden" name="id" value={o.id} />
          <input type="hidden" name="state" value={o.state} />
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              background: "var(--color-ink)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {NEXT_LABEL[o.state] ?? "Advance"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default async function OrdersPage() {
  const orders = await getUserOrders();
  const open = orders.filter((o) => o.state !== "closed");
  const netOpen = open.reduce((s, o) => s + o.net, 0);

  return (
    <main className="page">
      <AppHeader tagline="Order fulfillment" nav={buildNav("/orders")} />

      {orders.length === 0 ? (
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
            <IconPackage size={24} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No orders yet</div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              marginTop: 6,
              maxWidth: 380,
              margin: "6px auto 0",
              lineHeight: 1.5,
            }}
          >
            When a listing sells, hit <b>Mark sold</b> on the Listings page and
            it&apos;ll appear here to fulfill (order from Amazon → mark shipped).
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 24,
              alignItems: "baseline",
              background: "var(--color-surface)",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>
                To fulfill
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {open.length}
              </div>
            </div>
            <div style={{ borderLeft: "1px solid var(--color-line)", paddingLeft: 24 }}>
              <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>
                Open net
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--color-flip)",
                  letterSpacing: "-0.02em",
                }}
              >
                ${netOpen.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map((o) => (
              <OrderCard key={o.id} o={o} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
