export type MobileCheck = {
  label: string;
  tone: "ok" | "warn";
};

export type MobileScan = {
  store: { name: string; number: string };
  product: {
    title: string;
    upc: string;
    sku: string;
    price: number;
    inClubNote: string;
  };
  verdict: {
    netPerUnit: number;
    marginPct: number;
    soldDays: number;
  };
  stats: { sold: number; median: number; days: number };
  checks: MobileCheck[];
  cart: { defaultQty: number; tabCount: number };
};

export const mobileScan: MobileScan = {
  store: { name: "SAM'S", number: "#6612" },
  product: {
    title: "Member's Mark Organic Maple Syrup · 32 oz",
    upc: "193968046521",
    sku: "#980164",
    price: 13.98,
    inClubNote: "in-club",
  },
  verdict: {
    netPerUnit: 11.02,
    marginPct: 44,
    soldDays: 5,
  },
  stats: { sold: 9, median: 29, days: 5.1 },
  checks: [
    { label: "Stock at this club · 8 units", tone: "ok" },
    { label: "Not restricted brand", tone: "ok" },
    { label: "Pickup only · you ship yourself", tone: "warn" },
  ],
  cart: { defaultQty: 6, tabCount: 4 },
};
