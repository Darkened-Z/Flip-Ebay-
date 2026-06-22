import { AppHeader } from "@/components/brand";
import { DiscoverClient } from "@/components/discover/DiscoverClient";
import { buildNav } from "@/lib/nav";

export default function DiscoverPage() {
  return (
    <main className="page">
      <AppHeader tagline="Auto-sourcing" nav={buildNav("/discover")} />
      <DiscoverClient />
    </main>
  );
}
