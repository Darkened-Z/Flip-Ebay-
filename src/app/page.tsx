import { AppHeader } from "@/components/brand";
import { ScannerClient } from "@/components/scanner/ScannerClient";
import { mockScan } from "@/lib/mockData";
import { buildNav } from "@/lib/nav";

export default function ScannerPage() {
  return (
    <main className="page">
      <AppHeader tagline="Sourcing scanner" nav={buildNav("/")} />
      <ScannerClient initial={mockScan} />
    </main>
  );
}
