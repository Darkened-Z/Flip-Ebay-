import { AppHeader } from "@/components/brand";
import { StatCard } from "@/components/flip/StatCard";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import {
  inventorySummary,
  inventoryAlerts,
  inventoryRules,
  inventoryActivity,
  type InventoryAlert,
  type InventoryRule,
  type ActivityEvent,
  type ActivityVerbTone,
} from "@/lib/inventoryData";
import { buildNav } from "@/lib/nav";
import {
  IconBell,
  IconAlertTriangle,
  IconPlayerPause,
  IconClock,
  IconList,
  IconReceipt,
} from "@tabler/icons-react";

const card: React.CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 12px 28px -16px rgba(0,0,0,.12)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

function AlertBadge({ alert }: { alert: InventoryAlert }) {
  const paused = alert.badge === "paused";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 9px",
        borderRadius: 7,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.02em",
        background: paused ? "var(--color-cost-soft)" : "var(--color-amber-soft)",
        color: paused ? "var(--color-cost)" : "var(--color-amber-ink)",
        whiteSpace: "nowrap",
      }}
    >
      {alert.badgeLabel}
    </span>
  );
}

function AlertRow({ alert, last }: { alert: InventoryAlert; last: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 0",
        borderBottom: last ? "none" : "1px solid var(--color-line)",
      }}
    >
      <ProductGlyph size={40} variant={alert.productVariant} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {alert.title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginTop: 3,
            color:
              alert.noteTone === "cost"
                ? "var(--color-cost)"
                : "var(--color-amber-ink)",
          }}
        >
          {alert.note}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--color-muted)",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {alert.metric}
      </div>
      <AlertBadge alert={alert} />
    </div>
  );
}

function TogglePill({ on }: { on: boolean }) {
  if (on) {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "5px 13px",
          borderRadius: 9,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.03em",
          background: "var(--color-flip)",
          color: "#fff",
        }}
      >
        ON
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.03em",
        background: "transparent",
        color: "var(--color-faint)",
        border: "1px solid var(--color-line)",
      }}
    >
      OFF
    </span>
  );
}

function ThresholdChip({ value }: { value: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        background: "var(--color-surface-2)",
        color: "var(--color-ink)",
        border: "1px dashed var(--color-line)",
        cursor: "pointer",
      }}
    >
      {value}
    </span>
  );
}

function RuleRow({ rule, last }: { rule: InventoryRule; last: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 0",
        borderBottom: last ? "none" : "1px solid var(--color-line)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
          {rule.title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-muted)",
            marginTop: 3,
          }}
        >
          {rule.description}
        </div>
      </div>
      {rule.threshold ? <ThresholdChip value={rule.threshold} /> : null}
      <TogglePill on={rule.on} />
    </div>
  );
}

const VERB_COLOR: Record<ActivityVerbTone, string> = {
  cost: "var(--color-cost)",
  amber: "var(--color-amber-ink)",
  flip: "var(--color-flip)",
  ink: "var(--color-ink)",
  faint: "var(--color-faint)",
};

function ActivityRow({ event, last }: { event: ActivityEvent; last: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        padding: "9px 0",
        borderBottom: last ? "none" : "1px solid var(--color-line)",
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
      }}
    >
      <span style={{ color: "var(--color-faint)", whiteSpace: "nowrap" }}>
        {event.time}
      </span>
      <span style={{ fontWeight: 700, color: VERB_COLOR[event.verbTone] }}>
        {event.verb}
      </span>
      <span style={{ color: "var(--color-muted)" }}>{event.detail}</span>
    </div>
  );
}

export default function InventoryPage() {
  const s = inventorySummary;

  return (
    <main className="page">
      <AppHeader tagline="Inventory monitor" nav={buildNav("/inventory")} />

      <div className="grid-stats-4" style={{ marginTop: 20 }}>
        <StatCard
          icon={<IconBell size={16} />}
          label="Watching"
          value={s.watching}
        />
        <StatCard
          icon={<IconAlertTriangle size={16} />}
          label="Tripped"
          value={s.tripped}
          accent="var(--color-cost)"
          sublabel="need review"
          sublabelColor="var(--color-cost)"
        />
        <StatCard
          icon={<IconPlayerPause size={16} />}
          label="Auto-paused"
          value={s.autoPaused}
          sublabel="restore on OK"
        />
        <StatCard
          icon={<IconClock size={16} />}
          label="Poll interval"
          value={s.pollInterval}
          sublabel="edit"
        />
      </div>

      <section style={{ marginTop: 18 }}>
        <div style={sectionTitle}>
          <IconAlertTriangle size={16} style={{ color: "var(--color-cost)" }} />
          Active alerts · {inventoryAlerts.length}
        </div>
        <div style={{ ...card, paddingTop: 4, paddingBottom: 4 }}>
          {inventoryAlerts.map((alert, i) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              last={i === inventoryAlerts.length - 1}
            />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={sectionTitle}>
          <IconList size={16} style={{ color: "var(--color-flip)" }} />
          Rules
        </div>
        <div style={{ ...card, paddingTop: 4, paddingBottom: 4 }}>
          {inventoryRules.map((rule, i) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              last={i === inventoryRules.length - 1}
            />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={sectionTitle}>
          <IconReceipt size={16} style={{ color: "var(--color-muted)" }} />
          Recent activity
        </div>
        <div style={{ ...card, paddingTop: 6, paddingBottom: 6 }}>
          {inventoryActivity.map((event, i) => (
            <ActivityRow
              key={`${event.time}-${i}`}
              event={event}
              last={i === inventoryActivity.length - 1}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
