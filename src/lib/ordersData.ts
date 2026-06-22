export type OrderState = "new" | "ordered" | "shipped";

export type OrderSummary = {
  queue: number;
  countNew: number;
  countOrdered: number;
  countShipped: number;
  netToday: number;
};

export type NewOrder = {
  ebayId: string;
  title: string;
  subtitle: string;
  qty: number;
  received: number;
  agoLabel: string;
  productVariant?: "default" | "alt-1" | "alt-2";
  shipTo: {
    name: string;
    line1: string;
    line2: string;
    cityStateZip: string;
    country: string;
  };
  source: {
    label: string;
    url: string;
    now: number;
    marginLocked: number;
  };
};

export type ProgressOrder = {
  ebayId: string;
  title: string;
  state: Exclude<OrderState, "new">;
  stateLabel: string;
  agoLabel: string;
  metaMono: string;
  progressFilled: number;
  progressTotal: number;
  action: string;
  productVariant?: "default" | "alt-1" | "alt-2";
};

export const orderSummary: OrderSummary = {
  queue: 3,
  countNew: 1,
  countOrdered: 1,
  countShipped: 1,
  netToday: 71.04,
};

export const newOrder: NewOrder = {
  ebayId: "14-12903-77614",
  title: "Pedigree Dentastix Large 36ct · Bacon",
  subtitle: "Pet treats · single pack",
  qty: 1,
  received: 48.0,
  agoLabel: "4 min",
  productVariant: "default",
  shipTo: {
    name: "Marcus Whitfield",
    line1: "2418 Sycamore Ridge Dr · Apt 3B",
    line2: "Asheville, NC 28803",
    cityStateZip: "Asheville, NC 28803",
    country: "United States",
  },
  source: {
    label: "Amazon",
    url: "amazon.com/dp/B07Q4N5K2P",
    now: 18.59,
    marginLocked: 23.41,
  },
};

export const progressOrders: ProgressOrder[] = [
  {
    ebayId: "14-12903-77598",
    title: "Crayola Color Wonder Mini Markers 30ct",
    state: "ordered",
    stateLabel: "ORDERED",
    agoLabel: "1 h",
    metaMono: "eBay #14-12903-77598 · Amazon #112-4471892 · awaiting tracking",
    progressFilled: 2,
    progressTotal: 4,
    action: "Add tracking",
    productVariant: "alt-1",
  },
  {
    ebayId: "14-12903-77512",
    title: "Stanley Quencher H2.0 40oz Tumbler Charcoal",
    state: "shipped",
    stateLabel: "SHIPPED",
    agoLabel: "yesterday",
    metaMono: "eBay #14-12903-77512 · UPS 1Z999AA10123456784 · arrives Jun 24",
    progressFilled: 3,
    progressTotal: 4,
    action: "View",
    productVariant: "alt-2",
  },
];
