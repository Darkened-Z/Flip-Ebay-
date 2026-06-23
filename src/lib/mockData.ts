export type ScanResult = {
  reportNo: string;
  generatedAt: string;
  source: {
    url: string;
    id: string;
    title: string;
    subtitle: string;
    price: number;
    inStock: boolean;
    image: string | null;
  };
  verdict: {
    label: "Worth listing" | "Skip" | "Review";
    estimatedNet: number;
    marginPct: number;
    soldCount: number;
    soldDays: number;
    confidence: 1 | 2 | 3 | 4 | 5;
  };
  checks: Array<{ label: string; ok: boolean }>;
  pricing: {
    list: number;
    sourceCost: number;
    fees: number;
    shipping: number;
    tax: number;
    net: number;
  };
  velocity: {
    sold: number;
    avgDays: number;
    competitors: number;
    sellThroughPct: number;
    median: number;
    rangeLow: number;
    rangeHigh: number;
    bars: number[];
  };
  comps: Array<{
    date: string;
    price: number;
    seller: string;
    listedDays: number;
    faded?: boolean;
  }>;
};

export const mockScan: ScanResult = {
  reportNo: "№023",
  generatedAt: "06.22.2026 · 14:23 ET",
  source: {
    url: "amazon.com/dp/B07Q4N5K2P",
    id: "B07Q4N5K2P",
    title: "Pedigree Dentastix Large Dog Treats",
    subtitle: "36 ct · Bacon flavor",
    price: 18.59,
    inStock: true,
    image: null,
  },
  verdict: {
    label: "Worth listing",
    estimatedNet: 23.41,
    marginPct: 49,
    soldCount: 14,
    soldDays: 4,
    confidence: 4,
  },
  checks: [
    { label: "Ships from\nAmazon", ok: true },
    { label: "Prime\neligible", ok: true },
    { label: "US seller\nBuy It Now", ok: true },
    { label: "Has sold\ncomps", ok: true },
    { label: "Not restricted\nbrand", ok: true },
    { label: "Low-risk\ncategory", ok: true },
  ],
  pricing: {
    list: 48.0,
    sourceCost: 18.59,
    fees: 6.24,
    shipping: 0,
    tax: 0.24,
    net: 23.41,
  },
  velocity: {
    sold: 14,
    avgDays: 3.8,
    competitors: 6,
    sellThroughPct: 88,
    median: 47.2,
    rangeLow: 42.99,
    rangeHigh: 54.0,
    bars: [
      32, 18, 54, 24, 68, 42, 88, 30, 62, 48, 74, 22, 54, 36, 80, 44, 66, 28,
      78, 50, 90, 38, 72, 46, 96, 34, 60, 42,
    ],
  },
  comps: [
    { date: "Jun 19", price: 48.0, seller: "petsuppl_co", listedDays: 2 },
    { date: "Jun 17", price: 47.99, seller: "4paws_deals", listedDays: 5 },
    { date: "Jun 14", price: 46.5, seller: "brightside99", listedDays: 3 },
    { date: "Jun 11", price: 49.95, seller: "petsuppl_co", listedDays: 4 },
    {
      date: "Jun 08",
      price: 54.0,
      seller: "premium_pet",
      listedDays: 7,
      faded: true,
    },
  ],
};
