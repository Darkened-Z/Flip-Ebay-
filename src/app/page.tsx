import { AppHeader } from "@/components/brand";
import { ScannerClient } from "@/components/scanner/ScannerClient";
import { buildNav } from "@/lib/nav";

export default async function ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  return (
    <main className="page">
      <AppHeader tagline="Sourcing scanner" nav={buildNav("/")} />
      <ScannerClient initialUrl={url} />
    </main>
  );
}
