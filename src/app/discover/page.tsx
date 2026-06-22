import { AppHeader } from "@/components/brand";
import { DiscoverClient } from "@/components/discover/DiscoverClient";
import { getSeasonalSuggestions } from "@/lib/sourcing/seasonal";
import { buildNav } from "@/lib/nav";

export default function DiscoverPage() {
  const seasonal = getSeasonalSuggestions();
  return (
    <main className="page">
      <AppHeader tagline="Product hunt" nav={buildNav("/discover")} />
      <DiscoverClient seasonal={seasonal} />
    </main>
  );
}
