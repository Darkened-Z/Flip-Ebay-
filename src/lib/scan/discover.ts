import { quickSalePrice } from "./pricing";
import { isRestricted } from "@/lib/sourcing/restricted";
import { isExcludedCategory } from "@/lib/sourcing/excluded";
import { hasScraper, scrapeFetch, decodeEntities } from "./scrape";

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
  competition?: number; // total active eBay listings for the query (lower = easier to sell)
  source?: "search" | "deal";
};

export type DiscoverOutput = {
  candidates: Candidate[];
  related: string[];
};

const RAINFOREST = "https://api.rainforestapi.com/request";
const SERPAPI = "https://serpapi.com/search";

// eBay item-location filter: US only (verified — SerpApi honors LH_PrefLoc=1).
const EBAY_US_ONLY = "&LH_PrefLoc=1";
// Price against fixed-price (Buy It Now / Best Offer) sales, not auctions, whose
// hammer prices aren't representative. SerpApi ignores LH_BIN for sold listings,
// so we filter on each result's buying_format instead.
const isAuctionComp = (f?: string) => f === "auction";

type SearchRow = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  is_prime?: boolean;
  price?: { value?: number };
  ratings_total?: number; // review count — a free demand proxy
};
type DealRow = {
  asin?: string;
  title?: string;
  image?: string;
  link?: string;
  deal_price?: { value?: number }; // promotional/lightning price (temporary)
  current_price?: { value?: number }; // current buy price
  list_price?: { value?: number }; // regular/strikethrough price
  percent_off?: number; // discount depth — a free spread proxy
};
type SoldRow = {
  price?: { extracted?: number };
  condition?: string;
  title?: string;
  buying_format?: string; // buy_it_now | accepts_offers | auction
  location?: string;
  sold_date?: string; // e.g. "Jun 22, 2026"
};

async function getJson(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}
const round2 = (n: number) => Math.round(n * 100) / 100;

// What eBay takes on a sale, as a fraction of the sale price + a fixed per-order
// fee. EBAY_FEE_RATE is the all-in final value fee (≈13.25% + the ~0.35%
// regulatory operating fee; payment processing is already included in eBay's
// consolidated fee). PROMOTED_AD_RATE is our Promoted Listings ad rate. There is
// NO shipping cost: FLIP dropships, so Amazon ships to the eBay buyer with free
// Prime delivery. Adjust these to match your eBay fee calculator.
const EBAY_FEE_RATE = 0.136;
const PROMOTED_AD_RATE = 0.03;
const SELL_FEE_RATE = EBAY_FEE_RATE + PROMOTED_AD_RATE; // 16.6% of the sale
const EBAY_FEE_FIXED = 0.3;

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

// Treat a comp as off-limits only if it is EXPLICITLY a non-new condition.
// Missing/unknown condition strings are kept (eBay frequently omits them), but
// we never price a new-on-Amazon flip off used/refurb/parts sold comps.
const isUsedCond = (c?: string) =>
  /(used|refurb|pre-?owned|for parts|parts only|open box|seller refurbished|acceptable)/i.test(
    c ?? "",
  );

// Whole-word token match so "case" doesn't match "staircase".
const wordHit = (haystack: string, token: string) =>
  new RegExp(`\\b${token}\\b`).test(haystack);

// Filter + price a set of raw sold comps. Restricted to listings that are NOT
// explicitly used/refurb, not auctions, and (with a reference title) that match
// the product by whole-word token overlap — 2 tokens, precise but not so strict
// it starves the count. soldCount is the number sold in the LAST 30 DAYS (real
// recent velocity, since eBay's sold view reaches back ~a year); price is the
// quick-sale (~25th pct) of those recent comps, or of all matches if the recent
// sample is thin. No fallback to a noisy basket — a missed find beats a false one.
function computeSold(
  rows: SoldRow[],
  refTitle?: string,
): { price: number; soldCount: number } {
  let chosen = rows.filter(
    (r) => !isUsedCond(r.condition) && !isAuctionComp(r.buying_format),
  );
  if (refTitle) {
    const toks = keyTokens(refTitle);
    if (toks.length > 0) {
      const need = Math.min(2, toks.length);
      chosen = chosen.filter((r) => {
        const t = String(r.title ?? "").toLowerCase();
        return toks.filter((k) => wordHit(t, k)).length >= need;
      });
    }
  }
  const now = Date.now();
  const soldWithin30 = (raw?: string) => {
    const t = raw ? new Date(raw).getTime() : NaN;
    return !Number.isNaN(t) && now - t <= 30 * 86_400_000;
  };
  const recent = chosen.filter((r) => soldWithin30(r.sold_date));
  const priceFrom = recent.length >= 3 ? recent : chosen;
  const prices = priceFrom
    .map((x) => x.price?.extracted)
    .filter((p): p is number => typeof p === "number" && p > 0);
  return { price: quickSalePrice(prices), soldCount: recent.length };
}

// Parse eBay's public sold-search HTML into comp rows. The results page renders
// each listing in an `s-item` block (the first is a placeholder we skip).
function parseEbaySoldHtml(html: string): SoldRow[] {
  const rows: SoldRow[] = [];
  const blocks = html.split('class="s-item__info');
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i].slice(0, 1500);
    const titleRaw = b.match(
      /s-item__title[^>]*>(?:<span[^>]*>)?([^<]{3,120})/,
    )?.[1];
    if (!titleRaw) continue;
    const title = decodeEntities(titleRaw);
    if (!title || /shop on ebay/i.test(title)) continue;
    const priceRaw = b.match(
      /s-item__price[^>]*>(?:<[^>]+>)*\s*\$([\d,]+\.\d{2})/,
    )?.[1];
    const extracted = priceRaw ? Number(priceRaw.replace(/,/g, "")) : undefined;
    const soldDate = b.match(/Sold\s+([A-Z][a-z]{2}\s+\d{1,2},?\s*\d{4})/)?.[1];
    const condition = b.match(/SECONDARY_INFO[^>]*>([^<]{3,40})/)?.[1];
    rows.push({
      title,
      price: typeof extracted === "number" ? { extracted } : undefined,
      sold_date: soldDate,
      condition: condition ? decodeEntities(condition) : undefined,
    });
  }
  return rows;
}

// Sold comps. Preferred path: scrape eBay's own sold-search page for free (no
// per-call quota). LH_BIN=1 keeps it Buy-It-Now, LH_PrefLoc=1 US — both honored
// on the real site. Falls back to SerpApi only if no scraper key is configured.
async function ebaySold(
  query: string,
  seKey: string | undefined,
  refTitle?: string,
): Promise<{ price: number; soldCount: number }> {
  if (!query.trim()) return { price: 0, soldCount: 0 };
  if (hasScraper()) {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&LH_BIN=1&LH_PrefLoc=1&_ipg=60`;
    const html = await scrapeFetch(url);
    if (html) return computeSold(parseEbaySoldHtml(html), refTitle);
  }
  if (!seKey) return { price: 0, soldCount: 0 };
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete${EBAY_US_ONLY}&api_key=${seKey}`,
    );
    return computeSold((e.organic_results as SoldRow[]) ?? [], refTitle);
  } catch {
    return { price: 0, soldCount: 0 };
  }
}

// Total active eBay listings for a query — a competition proxy. Returns null
// (not 0) when the count is unavailable, so a failed/empty lookup is never
// mistaken for "zero competition" (which would fake a perfect sell-through).
export async function ebayActive(
  query: string,
  seKey: string,
): Promise<number | null> {
  if (!query.trim()) return null;
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}${EBAY_US_ONLY}&api_key=${seKey}`,
    );
    const info = e.search_information as { total_results?: number } | undefined;
    return typeof info?.total_results === "number" ? info.total_results : null;
  } catch {
    return null;
  }
}

// Is this ASIN comfortably in stock on Amazon (more than `min` units)? Costs one
// Rainforest product call. Amazon only shows an exact number when stock is low
// ("Only N left in stock"); a plain "In Stock" means plenty. Best-effort: on an
// error or missing data we keep the item rather than wrongly dropping a winner.
export async function inStockOver(asin: string, min = 10): Promise<boolean> {
  const { rfKey } = keys();
  if (!rfKey) return true;
  try {
    const p = await getJson(
      `${RAINFOREST}?api_key=${rfKey}&type=product&amazon_domain=amazon.com&asin=${encodeURIComponent(asin)}`,
    );
    const product = (p.product as Record<string, unknown>) ?? {};
    const bb = product.buybox_winner as
      | { availability?: { type?: string; raw?: string } }
      | undefined;
    const type = bb?.availability?.type ?? "";
    const raw = bb?.availability?.raw ?? "";
    if (type === "out_of_stock" || /out of stock|unavailable/i.test(raw))
      return false;
    const onlyLeft = raw.match(/only\s+(\d+)\s+left/i);
    if (onlyLeft) return Number(onlyLeft[1]) > min; // "Only N left in stock"
    return true; // "In Stock" with no number => plenty
  } catch {
    return true;
  }
}

async function ebayRelated(query: string, seKey: string): Promise<string[]> {
  try {
    const e = await getJson(
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete${EBAY_US_ONLY}&api_key=${seKey}`,
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
  const fees = round2(ebay.price * SELL_FEE_RATE + EBAY_FEE_FIXED);
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
  // Need Amazon data (Rainforest) + an eBay source (scraper or SerpApi). Never
  // fabricate "winners" in production: with no keys, return nothing rather than
  // mock data the client could mistake for real finds. Mocks stay for dev.
  if (!rfKey || (!seKey && !hasScraper())) {
    return process.env.NODE_ENV === "production"
      ? []
      : mockCandidates(term, limit);
  }

  const pageResults = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getJson(
        `${RAINFOREST}?api_key=${rfKey}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(term)}&page=${i + 1}`,
      ).catch(() => ({}) as Record<string, unknown>),
    ),
  );

  // Mine the FULL result set we already paid Rainforest for (~48/page), not just
  // the first few. Dedup by ASIN.
  const seen = new Set<string>();
  const all: SearchRow[] = [];
  for (const pr of pageResults) {
    for (const r of (pr.search_results as SearchRow[]) ?? []) {
      if (r.asin && !seen.has(r.asin)) {
        seen.add(r.asin);
        all.push(r);
      }
    }
  }

  // Free pre-filter (price, gated brands, bad-fit categories) + rank by review
  // count, then keep only `limit`. An eBay sold lookup costs one call each — the
  // scarce resource — so spend them on the most promising candidates from the
  // whole haul (popular products are likeliest to have real eBay demand) rather
  // than the arbitrary first few the search happened to return.
  const shortlist = all
    .filter((r) => {
      const price = r.price?.value;
      return (
        !!r.asin &&
        !!r.title &&
        typeof price === "number" &&
        price > 0 &&
        !isRestricted(r.title) &&
        !isExcludedCategory(r.title)
      );
    })
    .sort((a, b) => (b.ratings_total ?? 0) - (a.ratings_total ?? 0))
    .slice(0, limit);

  const candidates = await Promise.all(
    shortlist.map(async (r): Promise<Candidate | null> => {
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
  if (!rfKey || (!seKey && !hasScraper())) return [];
  try {
    const d = await getJson(
      `${RAINFOREST}?api_key=${rfKey}&type=deals&amazon_domain=amazon.com`,
    );
    // The deals feed returns ~30 discounted items. Free-filter, then rank by
    // discount depth (the bigger the markdown, the likelier it beats the eBay
    // sold price), and only eBay-check the top few.
    const dealCost = (r: DealRow) =>
      r.current_price?.value ?? r.list_price?.value ?? r.deal_price?.value;
    const shortlist = ((d.deals_results as DealRow[]) ?? [])
      .filter((r) => {
        const price = dealCost(r);
        return (
          !!r.asin &&
          !!r.title &&
          typeof price === "number" &&
          price > 0 &&
          !isRestricted(r.title) &&
          !isExcludedCategory(r.title)
        );
      })
      .sort((a, b) => (b.percent_off ?? 0) - (a.percent_off ?? 0))
      .slice(0, limit);
    const candidates = await Promise.all(
      shortlist.map(async (r): Promise<Candidate | null> => {
        const asin = r.asin;
        const title = r.title;
        // Anchor on the current/regular price, not the temporary lightning
        // deal price, so net reflects a cost the operator can still source at.
        const amazonPrice = dealCost(r);
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
      const fees = round2(ebayPrice * SELL_FEE_RATE + EBAY_FEE_FIXED);
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
