export type ListingStatus = "active" | "sold" | "paused";
export type ListingTone = "default" | "warn" | "alert";

export type Listing = {
  id: string;
  title: string;
  source: string;
  sku: string;
  status: ListingStatus;
  ageDays: number;
  views: number;
  listPrice: number;
  netProfit: number | null;
  tone: ListingTone;
  note?: string;
  productVariant?: "default" | "alt-1" | "alt-2";
  image?: string | null;
};

export type DashboardSummary = {
  active: number;
  activeDelta: string;
  soldToday: number;
  netToday: number;
  profitMTD: number;
  avgDaysToSell: number;
  alerts: number;
};

export const dashboardSummary: DashboardSummary = {
  active: 47,
  activeDelta: "+8 this week",
  soldToday: 3,
  netToday: 71.04,
  profitMTD: 842,
  avgDaysToSell: 4.2,
  alerts: 5,
};

export const listings: Listing[] = [
  {
    id: "1",
    title: "Pedigree Dentastix Large 36ct Bacon",
    source: "B07Q4N5K2P",
    sku: "P-DEN-36L",
    status: "sold",
    ageDays: 3,
    views: 142,
    listPrice: 48.0,
    netProfit: 23.41,
    tone: "default",
  },
  {
    id: "2",
    title: "Stanley Quencher H2.0 40oz Tumbler Charcoal",
    source: "B0CRMZQ3PT",
    sku: "S-STAN-40C",
    status: "active",
    ageDays: 2,
    views: 218,
    listPrice: 62.0,
    netProfit: 18.04,
    tone: "default",
    productVariant: "alt-1",
  },
  {
    id: "3",
    title: "LEGO Botanicals Wildflower Bouquet 10313",
    source: "B0BTYHJQ3F",
    sku: "L-LEG-WB",
    status: "paused",
    ageDays: 8,
    views: 87,
    listPrice: 72.0,
    netProfit: null,
    tone: "alert",
    note: "Amazon OOS · auto-paused 2h ago",
    productVariant: "alt-2",
  },
  {
    id: "4",
    title: "Owala FreeSip 32oz Insulated Water Bottle",
    source: "B0BBHL3F37",
    sku: "O-OWA-32",
    status: "active",
    ageDays: 5,
    views: 96,
    listPrice: 38.0,
    netProfit: 12.18,
    tone: "default",
  },
  {
    id: "5",
    title: "Yeti Rambler 14oz Mug · MagSlider Lid",
    source: "B07HHKLNFG",
    sku: "Y-YET-14M",
    status: "active",
    ageDays: 6,
    views: 61,
    listPrice: 34.99,
    netProfit: 3.1,
    tone: "warn",
    note: "Amazon +$4.20 · margin slim · review",
    productVariant: "alt-2",
  },
  {
    id: "6",
    title: "Crayola Color Wonder Mini Markers 30ct",
    source: "B07BDPBZWQ",
    sku: "C-CRA-30",
    status: "sold",
    ageDays: 1,
    views: 203,
    listPrice: 28.99,
    netProfit: 14.62,
    tone: "default",
    productVariant: "alt-1",
  },
  {
    id: "7",
    title: "Member's Mark Organic Maple Syrup 32oz",
    source: "samsclub 980164",
    sku: "M-MM-MS",
    status: "active",
    ageDays: 9,
    views: 44,
    listPrice: 24.99,
    netProfit: 8.85,
    tone: "default",
  },
  {
    id: "8",
    title: "Hydro Flask 32oz Wide Mouth Pacific Blue",
    source: "B07W7P78CB",
    sku: "H-HYD-32B",
    status: "active",
    ageDays: 11,
    views: 38,
    listPrice: 49.95,
    netProfit: 15.74,
    tone: "default",
    productVariant: "alt-2",
  },
];
