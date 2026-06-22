import { StatCard } from "@/components/flip/StatCard";
import { IconBox, IconCoin, IconWallet, IconList } from "@tabler/icons-react";

export function StatsRow({
  active,
  sold,
  netProfit,
  total,
}: {
  active: number;
  sold: number;
  netProfit: number;
  total: number;
}) {
  return (
    <div className="grid-stats-4">
      <StatCard icon={<IconBox size={16} />} label="Active" value={active} />
      <StatCard
        icon={<IconCoin size={16} />}
        label="Sold"
        value={sold}
        accent="var(--color-flip)"
      />
      <StatCard
        icon={<IconWallet size={16} />}
        label="Net profit (sold)"
        value={`$${netProfit.toFixed(2)}`}
        sublabelColor="var(--color-flip)"
      />
      <StatCard icon={<IconList size={16} />} label="Total listings" value={total} />
    </div>
  );
}
