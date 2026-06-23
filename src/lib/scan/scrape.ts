// Free fetch layer. eBay (and Amazon) block direct server requests with 403 +
// CAPTCHA, so we route page fetches through ScraperAPI — its free tier (5,000
// on signup + 1,000/mo) handles residential proxies + anti-bot for us, and we
// parse the returned HTML ourselves. Set SCRAPERAPI_KEY to enable.
const SCRAPERAPI = "https://api.scraperapi.com/";

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
