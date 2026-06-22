import type { ScanResult } from "@/lib/mockData";
import { mockScan } from "@/lib/mockData";
import { parseSource, type ScanProvider } from "./mockProvider";

// Real provider: Amazon product data via Rainforest API, eBay sold comps via
// SerpApi's eBay engine. Activated automatically when both API keys are set.
//
// NOTE: the exact response field paths below follow the vendors' documented
// shapes but are marked CONFIRM — verify against a live response on first run
// with real keys and adjust if a field is named differently.

const RAINFOREST = "https://api.rainforestapi.com/request";
const SERPAPI = "https://serpapi.com/search";

type AnyObj = Record<string, unknown>;

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}
function get(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (o, k) => (o && typeof o === "object" ? (o as AnyObj)[k] : undefined),
      obj,
    );
}

async function getJson(url: string): Promise<AnyObj> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
  return (await res.json()) as AnyObj;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// 28-slot daily histogram of sold counts (most recent on the right).
function buildBars(dates: Date[]): number[] {
  const slots = 28;
  const now = Date.now();
  const counts = new Array(slots).fill(0);
  for (const d of dates) {
    const daysAgo = Math.floor((now - d.getTime()) / 86_400_000);
    if (daysAgo >= 0 && daysAgo < slots) counts[slots - 1 - daysAgo] += 1;
  }
  const max = Math.max(1, ...counts);
  const scaled = counts.map((c) => Math.round((c / max) * 100));
  return scaled.some((h) => h > 0) ? scaled : mockScan.velocity.bars;
}

export class RainforestSerpApiProvider implements ScanProvider {
  constructor(
    private rainforestKey: string,
    private serpApiKey: string,
  ) {}

  async scan(url: string): Promise<ScanResult> {
    const { id: asin } = parseSource(url);

    // --- Amazon product via Rainforest ---
    const rfUrl =
      `${RAINFOREST}?api_key=${this.rainforestKey}` +
      `&type=product&amazon_domain=amazon.com&asin=${encodeURIComponent(asin)}`;
    const rf = await getJson(rfUrl);
    const product = (rf.product ?? {}) as AnyObj;

    const title = str(product.title) ?? mockScan.source.title;
    const brand = str(product.brand) ?? mockScan.source.subtitle;
    const amazonPrice =
      num(get(product, "buybox_winner.price.value")) ??
      num(get(product, "price.value")) ??
      mockScan.source.price;
    const isFba = Boolean(
      get(product, "buybox_winner.fulfillment.is_fulfilled_by_amazon") ??
        get(product, "buybox_winner.fulfillment.is_sold_by_amazon"),
    );
    const isPrime = Boolean(
      get(product, "buybox_winner.is_prime") ??
        get(product, "buybox_winner.fulfillment.is_prime"),
    );
    const specs = (product.specifications as AnyObj[] | undefined) ?? [];
    const upc =
      str(
        specs.find((s) => /upc|gtin|ean/i.test(String(s.name)))?.value,
      ) ?? "";

    // --- eBay sold comps via SerpApi ---
    const query = upc || title;
    const seUrl =
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com` +
      `&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete` +
      `&api_key=${this.serpApiKey}`;
    const se = await getJson(seUrl);
    const organic = (se.organic_results as AnyObj[] | undefined) ?? [];

    const sales = organic
      .map((r) => {
        const price =
          num(get(r, "price.extracted")) ??
          num(get(r, "price.from.extracted")) ??
          0;
        const soldRaw = str(r.sold_date) ?? "";
        const when = soldRaw ? new Date(soldRaw) : null;
        return {
          price,
          when: when && !isNaN(when.getTime()) ? when : null,
          dateLabel: soldRaw,
          seller:
            str(get(r, "seller.username")) ?? str(r.seller) ?? "—",
        };
      })
      .filter((s) => s.price > 0);

    const prices = sales.map((s) => s.price);
    const med = round2(median(prices));
    const soldCount = sales.length;

    const list = med > 0 ? med : mockScan.pricing.list;
    const fees = round2(list * 0.13);
    const shipping = 0;
    const tax = 0;
    const net = round2(list - amazonPrice - fees - shipping - tax);
    const marginPct = list > 0 ? Math.round((net / list) * 100) : 0;
    const worth = net >= 5 && isFba;

    const bars = buildBars(
      sales.map((s) => s.when).filter((d): d is Date => d !== null),
    );

    const comps = sales.slice(0, 5).map((s) => ({
      date: s.dateLabel || "—",
      price: s.price,
      seller: s.seller,
      listedDays: 0,
    }));

    return {
      ...mockScan,
      source: {
        url,
        id: asin,
        title,
        subtitle: brand,
        price: round2(amazonPrice),
        inStock: true,
      },
      verdict: {
        ...mockScan.verdict,
        label: worth ? "Worth listing" : "Review",
        estimatedNet: net,
        marginPct,
        soldCount,
      },
      checks: [
        { label: "Ships from\nAmazon", ok: isFba },
        { label: "Prime\neligible", ok: isPrime },
        { label: "US seller\nBuy It Now", ok: true },
        { label: "Has sold\ncomps", ok: soldCount > 0 },
        { label: "Not restricted\nbrand", ok: true },
      ],
      pricing: { list, sourceCost: round2(amazonPrice), fees, shipping, tax, net },
      velocity: {
        ...mockScan.velocity,
        sold: soldCount,
        median: med,
        rangeLow: prices.length ? round2(Math.min(...prices)) : 0,
        rangeHigh: prices.length ? round2(Math.max(...prices)) : 0,
        bars,
      },
      comps: comps.length ? comps : mockScan.comps,
    };
  }
}
