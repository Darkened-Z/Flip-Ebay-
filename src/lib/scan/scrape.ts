// Free eBay-data layer. eBay blocks direct server requests (403 + CAPTCHA), so
// we get sold comps one of two ways, in priority order:
//   1. Apify (APIFY_TOKEN) — a maintained eBay-sold actor returns clean JSON;
//      free tier $5/mo (~100 runs). Preferred: no parser for us to maintain.
//   2. ScraperAPI (SCRAPERAPI_KEY) — fetch eBay's sold page through its proxy
//      and parse the HTML ourselves; free 5,000 + 1,000/mo.
const SCRAPERAPI = "https://api.scraperapi.com/";
const APIFY_ACTS = "https://api.apify.com/v2/acts";

export function hasApify(): boolean {
  return !!process.env.APIFY_TOKEN;
}

// Apify's free plan can't handle many concurrent actor runs — a hunt firing one
// run per product gets most of them dropped (one succeeds, the rest fail). The
// real fix is batching many keywords into ONE run; this gate is the backstop.
let apifyActive = 0;
const apifyQueue: (() => void)[] = [];
const MAX_APIFY_CONCURRENT = 2;
async function withApifyLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (apifyActive >= MAX_APIFY_CONCURRENT) {
    await new Promise<void>((resolve) => apifyQueue.push(resolve));
  }
  apifyActive++;
  try {
    return await fn();
  } finally {
    apifyActive--;
    apifyQueue.shift()?.();
  }
}

// Run the eBay-sold actor for MANY keywords in ONE synchronous run; returns all
// dataset items, each tagged with its `keyword`. Default actor:
// caffein.dev/ebay-sold-listings — real proxies (lighter actors get 403'd),
// returns soldPrice/title/endedAt/condition/listingType. count is per keyword;
// daysToScrape=30 is our velocity window. Returns null on no-token / failure.
export async function apifyEbaySoldBatch(
  queries: string[],
): Promise<Record<string, unknown>[] | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token || queries.length === 0) return null;
  const actor = process.env.APIFY_ACTOR ?? "caffein.dev~ebay-sold-listings";
  return withApifyLimit(async () => {
    try {
      const r = await fetch(
        `${APIFY_ACTS}/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: queries, count: 20, daysToScrape: 30 }),
        },
      );
      if (!r.ok) return null;
      const data = await r.json();
      return Array.isArray(data) ? (data as Record<string, unknown>[]) : null;
    } catch {
      return null;
    }
  });
}

// Single-keyword convenience wrapper.
export async function apifyEbaySold(
  query: string,
): Promise<Record<string, unknown>[] | null> {
  return apifyEbaySoldBatch([query]);
}

export type AmazonRow = {
  asin: string;
  title: string;
  price: number;
  image: string | null;
  link: string;
};

// Amazon product search via Apify (igolaizola/amazon-search, $0.50/1K) — the
// free Amazon source replacing Rainforest's tiny 100-credit trial. Output fields
// are id (asin) / name (title) / price / image / url. Goes through the shared
// concurrency gate. Returns [] on no-token / failure.
export async function amazonSearch(
  term: string,
  maxItems = 20,
): Promise<AmazonRow[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token || !term.trim()) return [];
  const actor = process.env.APIFY_AMAZON_ACTOR ?? "igolaizola~amazon-search";
  const num = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") return Number(v.replace(/[^0-9.]/g, ""));
    return NaN;
  };
  const items = await withApifyLimit(async () => {
    try {
      const r = await fetch(
        `${APIFY_ACTS}/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            search: `https://www.amazon.com/s?k=${encodeURIComponent(term)}`,
            maxItems,
          }),
        },
      );
      if (!r.ok) return null;
      const d = await r.json();
      return Array.isArray(d) ? (d as Record<string, unknown>[]) : null;
    } catch {
      return null;
    }
  });
  if (!items) return [];
  return items
    .map((it): AmazonRow => {
      const priceObj =
        it.price && typeof it.price === "object"
          ? (it.price as { value?: unknown }).value
          : it.price;
      const asin =
        (typeof it.asin === "string" && it.asin) ||
        (typeof it.id === "string" && it.id) ||
        String(it.url ?? "").match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
        "";
      const price = num(priceObj);
      return {
        asin,
        title:
          typeof it.name === "string"
            ? it.name
            : typeof it.title === "string"
              ? it.title
              : "",
        price: Number.isFinite(price) ? price : 0,
        image: typeof it.image === "string" ? it.image : null,
        link: typeof it.url === "string" ? it.url : asin ? `amazon.com/dp/${asin}` : "",
      };
    })
    .filter((r) => r.asin && r.title && r.price > 0);
}

export type AmazonDetail = {
  shipsFromAmazon: boolean | null; // null = unknown (scrape returned nothing)
  inStock: boolean | null;
  discounted: boolean; // current price well below list price (may revert)
  hasVariants: boolean | null; // size/color/model options -> comp match unreliable
  seller: string;
};

// Fetch Amazon product detail for several ASINs in ONE run (delicious_zebu's
// product-details actor, input { Params: [asin...] }) to verify the Amazon side:
// who sells it (ships-from-Amazon), whether it's in stock, and whether the price
// is a temporary discount. Empty/missing fields stay `null` (unknown) so a flaky
// scrape never wrongly drops a winner. Returns a map keyed by ASIN.
export async function amazonDetails(
  asins: string[],
): Promise<Map<string, AmazonDetail>> {
  const out = new Map<string, AmazonDetail>();
  const token = process.env.APIFY_TOKEN;
  if (!token || asins.length === 0) return out;
  const actor =
    process.env.APIFY_PRODUCT_ACTOR ??
    "delicious_zebu~amazon-product-details-scraper";
  const num = (v: unknown) =>
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? Number(v.replace(/[^0-9.]/g, ""))
        : NaN;
  const items = await withApifyLimit(async () => {
    try {
      const r = await fetch(
        `${APIFY_ACTS}/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Params: asins }),
        },
      );
      if (!r.ok) return null;
      const d = await r.json();
      return Array.isArray(d) ? (d as Record<string, unknown>[]) : null;
    } catch {
      return null;
    }
  });
  if (!items) return out;
  for (const it of items) {
    const asin = typeof it.asin === "string" ? it.asin : "";
    if (!asin) continue;
    const seller = typeof it.seller_name === "string" ? it.seller_name : "";
    const avail = String(it.availability ?? "").toLowerCase();
    const price = num(it.price);
    const list = num(it.list_price);
    // Variant detection: the actor returns `default_variant` (the parent ASIN's
    // selected variant) and often a `variants` / `variations` array. Treat as
    // multi-variant when either is present — comp matching by title gets noisy
    // across sizes/colors/models, so we skip these for dropship safety.
    const variants = it.variants ?? it.variations ?? it.variantAsins;
    const hasVariantArray =
      Array.isArray(variants) && variants.length > 1;
    const hasDefaultVariant =
      it.default_variant != null &&
      typeof it.default_variant === "object" &&
      Object.keys(it.default_variant as object).length > 0;
    const sawAnyVariantField =
      "variants" in it || "variations" in it || "default_variant" in it;
    out.set(asin, {
      seller,
      shipsFromAmazon: seller ? /amazon/i.test(seller) : null,
      inStock: avail
        ? !/out of stock|unavailable|currently unavailable/.test(avail)
        : null,
      discounted:
        Number.isFinite(price) && Number.isFinite(list) && list > 0
          ? price < list * 0.85
          : false,
      hasVariants: sawAnyVariantField
        ? hasVariantArray || hasDefaultVariant
        : null,
    });
  }
  return out;
}

export function hasScraper(): boolean {
  return !!process.env.SCRAPERAPI_KEY;
}

// Fetch a URL's raw HTML through ScraperAPI. Returns null on no-key / failure so
// callers can fall back. country_code=us keeps results on the US marketplace.
export async function scrapeFetch(url: string): Promise<string | null> {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `${SCRAPERAPI}?api_key=${key}&country_code=us&url=${encodeURIComponent(url)}`,
      { cache: "no-store" },
    );
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

// Minimal HTML-entity decode for scraped text (titles).
export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#x?[0-9a-f]+;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
