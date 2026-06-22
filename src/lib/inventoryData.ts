export type AlertBadge = "paused" | "review";
export type NoteTone = "cost" | "amber";

export type InventoryAlert = {
  id: string;
  title: string;
  note: string;
  noteTone: NoteTone;
  metric: string;
  badge: AlertBadge;
  badgeLabel: string;
  productVariant?: "default" | "alt-1" | "alt-2";
};

export type InventoryRule = {
  id: string;
  title: string;
  description: string;
  on: boolean;
  threshold?: string;
};

export type ActivityVerbTone = "cost" | "amber" | "flip" | "ink" | "faint";

export type ActivityEvent = {
  time: string;
  verb: string;
  verbTone: ActivityVerbTone;
  detail: string;
};

export type InventorySummary = {
  watching: number;
  tripped: number;
  autoPaused: number;
  pollInterval: string;
};

export const inventorySummary: InventorySummary = {
  watching: 47,
  tripped: 5,
  autoPaused: 2,
  pollInterval: "30m",
};

export const inventoryAlerts: InventoryAlert[] = [
  {
    id: "a1",
    title: "LEGO Botanicals Wildflower Bouquet 10313",
    note: "Amazon OOS · paused 2 h ago · auto-restore on restock",
    noteTone: "cost",
    metric: "Was $44.99 / Stock 0",
    badge: "paused",
    badgeLabel: "PAUSED",
    productVariant: "alt-2",
  },
  {
    id: "a2",
    title: "Yeti Rambler 14oz Mug · MagSlider Lid",
    note: "Price ↑ $4.20 · margin $3.10 · below $5 floor",
    noteTone: "amber",
    metric: "$22.85 → $27.05 / ↑ 18%",
    badge: "review",
    badgeLabel: "REVIEW",
    productVariant: "alt-2",
  },
  {
    id: "a3",
    title: "Member's Mark Organic Maple Syrup 32oz",
    note: "Sam's Club OOS · pickup only at 2 stores · paused",
    noteTone: "cost",
    metric: "Was $13.98 / Stock 0",
    badge: "paused",
    badgeLabel: "PAUSED",
    productVariant: "alt-1",
  },
  {
    id: "a4",
    title: "Owala FreeSip 32oz Insulated Water Bottle",
    note: "Ships from 3rd-party · no longer Amazon · review",
    noteTone: "amber",
    metric: "$25.82 / Stock 12",
    badge: "review",
    badgeLabel: "REVIEW",
    productVariant: "default",
  },
  {
    id: "a5",
    title: "Hydro Flask 32oz Wide Mouth Pacific Blue",
    note: "Competitor undercut · 4 sellers below $44.95",
    noteTone: "amber",
    metric: "$49.95 vs $44.95 / −10%",
    badge: "review",
    badgeLabel: "REVIEW",
    productVariant: "alt-2",
  },
];

export const inventoryRules: InventoryRule[] = [
  {
    id: "r1",
    title: "Auto-pause when source goes out of stock",
    description: "Amazon + Sam's · resumes on restock",
    on: true,
  },
  {
    id: "r2",
    title: "Alert when margin drops below threshold",
    description: "Triggers review · does not auto-pause",
    threshold: "$5.00",
    on: true,
  },
  {
    id: "r3",
    title: "Pause if Ships-from-Amazon goes false",
    description: "Prevents non-Prime fulfillment surprises",
    on: true,
  },
  {
    id: "r4",
    title: "Auto-reprice when competitor undercuts",
    description: "Match lowest within floor · never below margin rule",
    threshold: "±$2 of low",
    on: false,
  },
  {
    id: "r5",
    title: "Notify on every alert",
    description: "Email seo@daikimedia.com · digest at 09:00 if quiet",
    on: true,
  },
];

export const inventoryActivity: ActivityEvent[] = [
  {
    time: "14:23",
    verb: "paused",
    verbTone: "cost",
    detail: "LEGO Botanicals — Amazon OOS",
  },
  {
    time: "14:01",
    verb: "alert",
    verbTone: "amber",
    detail: "Yeti Mug — margin $3.10 (rule floor $5)",
  },
  {
    time: "12:48",
    verb: "resumed",
    verbTone: "flip",
    detail: "Crayola Markers — back in stock",
  },
  {
    time: "11:30",
    verb: "repriced",
    verbTone: "ink",
    detail: "Stanley Tumbler — $64 → $62 (competitor match)",
  },
  {
    time: "09:00",
    verb: "digest",
    verbTone: "faint",
    detail: "3 alerts cleared overnight — email sent",
  },
];
