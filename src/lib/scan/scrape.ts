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
