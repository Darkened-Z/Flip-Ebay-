import { quickSalePrice } from "./pricing";

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
  competition?: number; // active eBay listings (lower = easier to sell)
  sellThrough?: number; // sold / (sold + active), %
  source?: "search" | "deal";
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
type DealRow = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  deal_price?: { value?: number };
  current_price?: { value?: number };
};
type SoldRow = { price?: { extracted?: number }; condition?: string; title?: string };

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}
const round2 = (n: number) => Math.round(n * 100) / 100;

export function demandScore(net: number, soldCount: number): number {
  return net * (1 + Math.min(soldCount, 20) / 5);
}

function keys(): { rfKey?: string; seKey?: string } {
  return {
    rfKey: process.env.RAINFOREST_API_KEY,
    seKey: process.env.SERPAPI_KEY,
  };
}

// Trim a long Amazon title to core keywords for a broader eBay match.
export function cleanQuery(title: string): string {
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

const STOP = new Set([
  "with",
  "for",
  "and",
  "the",
  "set",
  "pack",
  "new",
  "size",
  "pcs",
  "piece",
  "pieces",
  "count",
]);
function keyTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, 6);
}

const isNewCond = (c?: string) =>
  /\bnew\b/i.test(c ?? "") && !/used|parts|refurb|pre-?owned/i.test(c ?? "");

// Sold comps → quick-sale price + count, filtered to NEW and (when a reference
// title is given) to listings that actually match the product (token overlap).
async function ebaySold(
  query: string,
  seKey: string,
  refTitle?: string,
): Promise<{ price: number; soldCount: number }> {
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete&api_key=${seKey}`,
    );
    const results = (e.organic_results as SoldRow[]) ?? [];
    let chosen = results.filter((r) => isNewCond(r.condition));
    if (chosen.length === 0) chosen = results;

    if (refTitle) {
      const toks = keyTokens(refTitle);
      const rel = chosen.filter((r) => {
        const t = String(r.title ?? "").toLowerCase();
        return toks.filter((k) => t.includes(k)).length >= 2;
      });
      if (rel.length >= 3) chosen = rel; // only tighten if enough remain
    }

    const prices = chosen
      .map((x) => x.price?.extracted)
      .filter((p): p is number => typeof p === "number" && p > 0);
    return { price: quickSalePrice(prices), soldCount: prices.length };
  } catch {
    return { price: 0, soldCount: 0 };
  }
}

// Active eBay listings for a query — a competition proxy.
export async function ebayActive(query: string, seKey: string): Promise<number> {
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}&api_key=${seKey}`,
    );
    const info = e.search_information as { total_results?: number } | undefined;
    if (typeof info?.total_results === "number") return info.total_results;
    return ((e.organic_results as unknown[]) ?? []).length;
  } catch {
    return 0;
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

function toCandidate(
  asin: string,
  title: string,
  amazonPrice: number,
  image: string | null,
  link: string,
  isPrime: boolean,
  ebay: { price: number; soldCount: number },
  source: "search" | "deal",
): Candidate {
  const fees = round2(ebay.price * 0.136 + 0.3);
  const net = round2(ebay.price - amazonPrice - fees);
  return {
    asin,
    title,
    image,
    link,
    amazonPrice: round2(amazonPrice),
    ebayPrice: ebay.price,
    soldCount: ebay.soldCount,
    net,
    marginPct: ebay.price > 0 ? Math.round((net / ebay.price) * 100) : 0,
    isPrime,
    worth: net >= 5 && ebay.soldCount >= 3,
    source,
  };
}

// Amazon search across `pages` pages → per-product eBay sold check → candidates.
export async function searchCandidates(
  term: string,
  limit: number,
  pages = 2,
): Promise<Candidate[]> {
  const { rfKey, seKey } = keys();
  if (!rfKey || !seKey) return mockCandidates(term, limit);

  const pageResults = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getJson(
        `${RAINFOREST}?api_key=${rfKey}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(term)}&page=${i + 1}`,
      ).catch(() => ({}) as Record<string, unknown>),
    ),
  );

  const seen = new Set<string>();
  const rows: SearchRow[] = [];
  for (const pr of pageResults) {
    for (const r of (pr.search_results as SearchRow[]) ?? []) {
      if (r.asin && !seen.has(r.asin)) {
        seen.add(r.asin);
        rows.push(r);
        if (rows.length >= limit) break;
      }
    }
    if (rows.length >= limit) break;
  }

  const candidates = await Promise.all(
    rows.map(async (r): Promise<Candidate | null> => {
      const asin = r.asin;
      const title = r.title;
      const amazonPrice = r.price?.value;
      if (!asin || !title || typeof amazonPrice !== "number") return null;
      const ebay = await ebaySold(cleanQuery(title), seKey, title);
      return toCandidate(
        asin,
        title,
        amazonPrice,
        r.image ?? null,
        r.link ?? `amazon.com/dp/${asin}`,
        !!r.is_prime,
        ebay,
        "search",
      );
    }),
  );

  return candidates
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => demandScore(b.net, b.soldCount) - demandScore(a.net, a.soldCount));
}

// Amazon "today's deals" feed → per-product eBay sold check → candidates.
export async function dealsCandidates(limit: number): Promise<Candidate[]> {
  const { rfKey, seKey } = keys();
  if (!rfKey || !seKey) return [];
  try {
    const d = await getJson(
      `${RAINFOREST}?api_key=${rfKey}&type=deals&amazon_domain=amazon.com`,
    );
    const rows = ((d.deals_results as DealRow[]) ?? []).slice(0, limit);
    const candidates = await Promise.all(
      rows.map(async (r): Promise<Candidate | null> => {
        const asin = r.asin;
        const title = r.title;
        const amazonPrice = r.deal_price?.value ?? r.current_price?.value;
        if (!asin || !title || typeof amazonPrice !== "number") return null;
        const ebay = await ebaySold(cleanQuery(title), seKey, title);
        return toCandidate(
          asin,
          title,
          amazonPrice,
          r.image ?? null,
          r.link ?? `amazon.com/dp/${asin}`,
          false,
          ebay,
          "deal",
        );
      }),
    );
    return candidates.filter((c): c is Candidate => c !== null);
  } catch {
    return [];
  }
}

function mockCandidates(term: string, limit: number): Candidate[] {
  return Array.from({ length: limit })
    .map((_, i) => {
      const amazonPrice = round2(12 + i * 3.5);
      const ebayPrice = round2(amazonPrice + 14 - i * 2);
      const fees = round2(ebayPrice * 0.136 + 0.3);
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
        source: "search" as const,
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
