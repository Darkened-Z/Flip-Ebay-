import type { ScanResult } from "@/lib/mockData";
import { mockScan } from "@/lib/mockData";
import { parseSource, type ScanProvider } from "./mockProvider";
import { quickSalePrice } from "./pricing";
import { isRestricted } from "@/lib/sourcing/restricted";

// Real provider: Amazon product data via Rainforest API, eBay sold + active
// comps via SerpApi's eBay engine. Activated when both API keys are set.
// Field paths verified against live responses (ASIN B073JYC4XM, Jun 2026).

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
    const isPrime = Boolean(get(product, "buybox_winner.is_prime"));
    const specs = (product.specifications as AnyObj[] | undefined) ?? [];
    const upc =
      str(specs.find((s) => /upc|gtin|ean/i.test(String(s.name)))?.value) ??
      str(product.gtin) ??
      "";

    const query = upc || title;

    // --- eBay SOLD comps via SerpApi ---
    const seUrl =
      `${SERPAPI}?engine=ebay&ebay_domain=ebay.com` +
      `&_nkw=${encodeURIComponent(query)}&show_only=Sold,Complete` +
      `&api_key=${this.serpApiKey}`;
    const se = await getJson(seUrl);
    const organic = (se.organic_results as AnyObj[] | undefined) ?? [];

    const isNew = (c: string) =>
      /\bnew\b/i.test(c) && !/used|parts|refurb|pre-?owned/i.test(c);
    const mapped = organic
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
          condition: str(r.condition) ?? "",
          seller: str(get(r, "seller.username")) ?? str(r.seller) ?? "—",
        };
      })
      .filter((s) => s.price > 0);
    // Keep only NEW sold comps (we sell new); fall back to all if none tagged.
    const newOnly = mapped.filter((s) => isNew(s.condition));
    const sales = newOnly.length ? newOnly : mapped;

    const prices = sales.map((s) => s.price);
    const med = round2(median(prices));
    const soldCount = sales.length;

    // --- eBay ACTIVE listings (competitors + sell-through) via SerpApi ---
    let activeCount = 0;
    try {
      const actUrl =
        `${SERPAPI}?engine=ebay&ebay_domain=ebay.com` +
        `&_nkw=${encodeURIComponent(query)}&api_key=${this.serpApiKey}`;
      const act = await getJson(actUrl);
      activeCount =
        num(get(act, "search_information.total_results")) ??
        ((act.organic_results as AnyObj[] | undefined)?.length ?? 0);
    } catch {
      // best-effort
    }

    const sellThroughPct =
      soldCount + activeCount > 0
        ? Math.round((soldCount / (soldCount + activeCount)) * 100)
        : mockScan.velocity.sellThroughPct;

    // average days between sales, from the sold-date span
    const times = sales
      .map((s) => s.when)
      .filter((d): d is Date => d !== null)
      .map((d) => d.getTime());
    const spanDays =
      times.length > 1
        ? (Math.max(...times) - Math.min(...times)) / 86_400_000
        : 0;
    const avgDays =
      soldCount > 1 && spanDays > 0
        ? Math.max(1, round2(spanDays / (soldCount - 1)))
        : mockScan.velocity.avgDays;
    const confidence: 1 | 2 | 3 | 4 | 5 =
      soldCount >= 20
        ? 5
        : soldCount >= 10
          ? 4
          : soldCount >= 5
            ? 3
            : soldCount >= 2
              ? 2
              : 1;

    // --- pricing + verdict ---
    // List at the quick-sale price (low end of sold comps) to sell fast;
    // med (the true median) is still shown as a sold-history stat.
    const qsp = quickSalePrice(prices);
    const list = qsp > 0 ? qsp : med > 0 ? med : mockScan.pricing.list;
    // eBay final value fee ~13.6% + $0.30; item ships from Amazon (Prime) to
    // the buyer, so no separate eBay shipping cost.
    const fees = round2(list * 0.136 + 0.3);
    const shipping = 0;
    const tax = 0;
    const net = round2(list - amazonPrice - fees - shipping - tax);
    const marginPct = list > 0 ? Math.round((net / list) * 100) : 0;
    const worth = net >= 5 && isFba && soldCount > 0;

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
        soldDays: Math.round(avgDays),
        confidence,
      },
      checks: [
        { label: "Ships from\nAmazon", ok: isFba },
        { label: "Prime\neligible", ok: isPrime },
        { label: "US seller\nBuy It Now", ok: true },
        { label: "Has sold\ncomps", ok: soldCount > 0 },
        { label: "Not restricted\nbrand", ok: !isRestricted(title, brand) },
      ],
      pricing: { list, sourceCost: round2(amazonPrice), fees, shipping, tax, net },
      velocity: {
        sold: soldCount,
        avgDays,
        competitors: activeCount,
        sellThroughPct,
        median: med,
        rangeLow: prices.length ? round2(Math.min(...prices)) : 0,
        rangeHigh: prices.length ? round2(Math.max(...prices)) : 0,
        bars,
      },
      comps: comps.length ? comps : mockScan.comps,
    };
  }
}
