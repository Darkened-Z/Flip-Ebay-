import type { ScanResult } from "@/lib/mockData";
import { MockProvider, type ScanProvider } from "./mockProvider";
import { RainforestSerpApiProvider } from "./realProvider";

// Uses the real Rainforest + SerpApi provider when both keys are present,
// otherwise falls back to the mock provider so the app always works.
function getProvider(): ScanProvider {
  const rainforest = process.env.RAINFOREST_API_KEY;
  const serpapi = process.env.SERPAPI_KEY;
  if (rainforest && serpapi) {
    return new RainforestSerpApiProvider(rainforest, serpapi);
  }
  return new MockProvider();
}

export async function runScan(url: string): Promise<ScanResult> {
  return getProvider().scan(url);
}
