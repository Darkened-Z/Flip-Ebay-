import { StatCard } from "@/components/flip/StatCard";
import type { DashboardSummary } from "@/lib/listingsData";
import {
  IconBox,
  IconCoin,
  IconWallet,
  IconClockHour4,
  IconAlertTriangle,
} from "@tabler/icons-react";

export function StatsRow({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid-stats-5">
      <StatCard
        icon={<IconBox size={16} />}
        label="Active"
        value={summary.active}
        sublabel={summary.activeDelta}
      />
      <StatCard
        icon={<IconCoin size={16} />}
        label="Sold today"
        value={summary.soldToday}
        sublabel={`+$${summary.netToday.toFixed(2)} net`}
        sublabelColor="var(--color-flip)"
      />
      <StatCard
        icon={<IconWallet size={16} />}
        label="Profit MTD"
        value={`$${summary.profitMTD}`}
        sublabel="22-day window"
      />
      <StatCard
        icon={<IconClockHour4 size={16} />}
        label="Avg days to sell"
        value={summary.avgDaysToSell}
        sublabel="target ≤ 4"
      />
      <StatCard
        icon={<IconAlertTriangle size={16} />}
        label="Needs attention"
        value={summary.alerts}
        sublabel="price jumps · OOS"
        accent="var(--color-cost)"
        sublabelColor="var(--color-cost)"
      />
    </div>
  );
}
