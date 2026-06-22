// One product surfaced by an auto-sourcing search.
export type Candidate = {
  asin: string;
  title: string;
  image: string | null;
  link: string;
  amazonPrice: number;
  ebayMedian: number;
  soldCount: number;
  net: number;
  marginPct: number;
  worth: boolean;
};

const RAINFOREST = "https://api.rainforestapi.com/request";
const SERPAPI = "https://serpapi.com/search";

type SearchRow = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  price?: { value?: number };
};

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}
function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const round2 = (n: number) => Math.round(n * 100) / 100;

function mockCandidates(term: string, limit: number): Candidate[] {
  return Array.from({ length: limit }).map((_, i) => {
    const amazonPrice = round2(12 + i * 3.5);
    const ebayMedian = round2(amazonPrice + 14 - i * 2);
    const fees = round2(ebayMedian * 0.13);
    const net = round2(ebayMedian - amazonPrice - fees);
    return {
      asin: `B0MOCK${String(i).padStart(4, "0")}`,
      title: `${term} — sample product ${i + 1}`,
      image: null,
      link: "amazon.com/dp/B0MOCK" + String(i).padStart(4, "0"),
      amazonPrice,
      ebayMedian,
      soldCount: 12 - i,
      net,
      marginPct: ebayMedian > 0 ? Math.round((net / ebayMedian) * 100) : 0,
      worth: net >= 5,
    };
  }).sort((a, b) => b.net - a.net);
}

export async function discover(term: string, limit: number): Promise<Candidate[]> {
  const rfKey = process.env.RAINFOREST_API_KEY;
  const seKey = process.env.SERPAPI_KEY;
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

      let med = 0;
      let soldCount = 0;
      try {
        const e = await getJson(
          `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(title)}&show_only=Sold,Complete&api_key=${seKey}`,
        );
        const prices = ((e.organic_results as { price?: { extracted?: number } }[]) ?? [])
          .map((x) => x.price?.extracted)
          .filter((p): p is number => typeof p === "number" && p > 0);
        med = round2(median(prices));
        soldCount = prices.length;
      } catch {
        // skip eBay errors for this candidate
      }

      const fees = round2(med * 0.13);
      const net = round2(med - amazonPrice - fees);
      return {
        asin,
        title,
        image: r.image ?? null,
        link: r.link ?? `amazon.com/dp/${asin}`,
        amazonPrice: round2(amazonPrice),
        ebayMedian: med,
        soldCount,
        net,
        marginPct: med > 0 ? Math.round((net / med) * 100) : 0,
        worth: net >= 5 && soldCount > 0,
      };
    }),
  );

  return candidates
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => b.net - a.net);
}
