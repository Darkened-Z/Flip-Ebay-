import { quickSalePrice } from "./pricing";

// One product surfaced by an auto-sourcing search.
export type Candidate = {
  asin: string;
  title: string;
  image: string | null;
  link: string;
  amazonPrice: number;
  ebayPrice: number; // quick-sale price (low end of sold comps), not median
  soldCount: number;
  net: number;
  marginPct: number;
  isPrime: boolean;
  worth: boolean;
};

export type DiscoverOutput = {
  candidates: Candidate[];
  related: string[];
};

const RAINFOREST = "https://api.rainforestapi.com/request";
const SERPAPI = "https://serpapi.com/search";

type SearchRow = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  is_prime?: boolean;
  price?: { value?: number };
};

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}
const round2 = (n: number) => Math.round(n * 100) / 100;

// Amazon titles are long and over-specific; trimming to the core keywords
// matches far more eBay sold listings (better demand signal).
function cleanQuery(title: string): string {
  return title
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\b\d+\s?(pcs?|pack|count|ct)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(" ");
}

// Demand-weighted score: profit, amplified by eBay sales velocity (capped).
export function demandScore(net: number, soldCount: number): number {
  return net * (1 + Math.min(soldCount, 20) / 5);
}

function keys(): { rfKey?: string; seKey?: string } {
  return {
    rfKey: process.env.RAINFOREST_API_KEY,
    seKey: process.env.SERPAPI_KEY,
  };
}

async function ebaySold(
  query: string,
  seKey: string,
): Promise<{ price: number; soldCount: number }> {
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete&api_key=${seKey}`,
    );
    const prices = ((e.organic_results as { price?: { extracted?: number } }[]) ?? [])
      .map((x) => x.price?.extracted)
      .filter((p): p is number => typeof p === "number" && p > 0);
    return { price: quickSalePrice(prices), soldCount: prices.length };
  } catch {
    return { price: 0, soldCount: 0 };
  }
}

async function ebayRelated(query: string, seKey: string): Promise<string[]> {
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete&api_key=${seKey}`,
    );
    const rs = (e.related_searches as { query?: string }[]) ?? [];
    return rs
      .map((r) => r.query)
      .filter((q): q is string => typeof q === "string" && q.length > 0)
      .slice(0, 8);
  } catch {
    return [];
  }
}

// Amazon search → per-product eBay sold check → ranked candidates (no related).
// Shared by manual Discover search and the autonomous hunt.
export async function searchCandidates(
  term: string,
  limit: number,
): Promise<Candidate[]> {
  const { rfKey, seKey } = keys();
  if (!rfKey || !seKey) return mockCandidates(term, limit);

  const search = await getJson(
    `${RAINFOREST}?api_key=${rfKey}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(term)}`,
  );
  const rows = ((search.search_results as SearchRow[]) ?? []).slice(0, limit);

  const candidates = await Promise.all(
    rows.map(async (r): Promise<Candidate | null> => {
      const asin = r.asin;
      const title = r.title;
      const amazonPrice = r.price?.value;
      if (!asin || !title || typeof amazonPrice !== "number") return null;

      const { price: ebayPrice, soldCount } = await ebaySold(
        cleanQuery(title),
        seKey,
      );
      const fees = round2(ebayPrice * 0.13);
      const net = round2(ebayPrice - amazonPrice - fees);
      return {
        asin,
        title,
        image: r.image ?? null,
        link: r.link ?? `amazon.com/dp/${asin}`,
        amazonPrice: round2(amazonPrice),
        ebayPrice,
        soldCount,
        net,
        marginPct: ebayPrice > 0 ? Math.round((net / ebayPrice) * 100) : 0,
        isPrime: !!r.is_prime,
        worth: net >= 5 && soldCount >= 3,
      };
    }),
  );

  return candidates
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => demandScore(b.net, b.soldCount) - demandScore(a.net, a.soldCount));
}

function mockCandidates(term: string, limit: number): Candidate[] {
  return Array.from({ length: limit })
    .map((_, i) => {
      const amazonPrice = round2(12 + i * 3.5);
      const ebayPrice = round2(amazonPrice + 14 - i * 2);
      const fees = round2(ebayPrice * 0.13);
      const net = round2(ebayPrice - amazonPrice - fees);
      const soldCount = 14 - i;
      return {
        asin: `B0MOCK${String(i).padStart(4, "0")}`,
        title: `${term} — sample product ${i + 1}`,
        image: null,
        link: "amazon.com/dp/B0MOCK" + String(i).padStart(4, "0"),
        amazonPrice,
        ebayPrice,
        soldCount,
        net,
        marginPct: ebayPrice > 0 ? Math.round((net / ebayPrice) * 100) : 0,
        isPrime: true,
        worth: net >= 5 && soldCount >= 3,
      };
    })
    .sort((a, b) => demandScore(b.net, b.soldCount) - demandScore(a.net, a.soldCount));
}

export async function discover(
  term: string,
  limit: number,
): Promise<DiscoverOutput> {
  const { seKey } = keys();
  const [candidates, related] = await Promise.all([
    searchCandidates(term, limit),
    seKey ? ebayRelated(term, seKey) : Promise.resolve<string[]>([]),
  ]);
  return { candidates, related };
}
