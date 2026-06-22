import type { ScanResult } from "@/lib/mockData";
import { mockScan } from "@/lib/mockData";

// A scan provider turns a product URL into a ScanResult. Swap the mock for a
// real (Rainforest + SerpApi) provider later without touching the UI or action.
export interface ScanProvider {
  scan(url: string): Promise<ScanResult>;
}

export function parseSource(url: string): {
  source: "amazon" | "sams" | "unknown";
  id: string;
} {
  const u = url.toLowerCase();
  const asin =
    url.match(/\/dp\/([A-Z0-9]{10})/i) ||
    url.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
    url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
  const id = asin ? asin[1].toUpperCase() : "";
  if (u.includes("amazon.")) return { source: "amazon", id: id || "B0XXXXXXXX" };
  if (u.includes("samsclub.")) return { source: "sams", id: id || "SAMS-000000" };
  return { source: "unknown", id: id || "UNKNOWN" };
}

// Deterministic per-URL variation so different URLs feel like different products.
function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export class MockProvider implements ScanProvider {
  async scan(url: string): Promise<ScanResult> {
    // Simulate network latency so the loading state is visible.
    await new Promise((r) => setTimeout(r, 650));

    const { id } = parseSource(url);
    const seed = seedFrom(url || mockScan.source.url);

    const netDelta = (seed % 1600) / 100 - 8; // roughly -8 .. +8
    const est =
      Math.round(Math.max(2, mockScan.verdict.estimatedNet + netDelta) * 100) /
      100;
    const margin = Math.min(
      72,
      Math.max(8, Math.round((est / mockScan.pricing.list) * 100)),
    );
    const sold = 4 + (seed % 22);

    return {
      ...mockScan,
      reportNo: `№${(seed % 900) + 100}`,
      source: { ...mockScan.source, url: url || mockScan.source.url, id },
      verdict: {
        ...mockScan.verdict,
        estimatedNet: est,
        marginPct: margin,
        soldCount: sold,
        label: est >= 8 ? "Worth listing" : "Review",
      },
      pricing: { ...mockScan.pricing, net: est },
      velocity: { ...mockScan.velocity, sold },
    };
  }
}
