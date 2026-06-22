import type { ScanResult } from "@/lib/mockData";
import { MockProvider, type ScanProvider } from "./mockProvider";

// Selects the active scan provider. When the real API keys are present we'll
// return a RainforestSerpApiProvider here instead — the only line that changes.
function getProvider(): ScanProvider {
  // if (process.env.RAINFOREST_API_KEY && process.env.SERPAPI_KEY) {
  //   return new RainforestSerpApiProvider();
  // }
  return new MockProvider();
}

export async function runScan(url: string): Promise<ScanResult> {
  return getProvider().scan(url);
}
