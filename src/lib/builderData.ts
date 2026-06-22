export type SpecRow = {
  k: string;
  v: string;
  mono?: boolean;
  required?: boolean;
};

export type SetupRow = {
  k: string;
  v: string;
};

export const builderData = {
  anchor: {
    title: "Pedigree Dentastix Large Dog Treats · 36 ct",
    sourcePrice: 18.59,
    listPrice: 48.0,
    estNet: 23.41,
  },
  title: {
    value:
      "Pedigree DENTASTIX Large Dog Dental Treats Bacon Flavor 36 Count Fresh Breath",
    max: 80,
  },
  keywords: ["+ Greenies alt.", "+ Plaque", "+ Chew", "+ Bulk", "+ XL"],
  images: {
    count: 5,
    capacity: 12,
    source: "amazon.com",
    variants: ["default", "alt-1", "alt-2", "default", "alt-2"] as const,
  },
  itemSpecifics: [
    { k: "Brand", v: "Pedigree" },
    { k: "Size", v: "Large" },
    { k: "Quantity", v: "36 ct" },
    { k: "Flavor", v: "Bacon" },
    { k: "UPC", v: "023100119326", mono: true },
    { k: "MPN", v: "79002", mono: true },
    { k: "Pet life stage", v: "Adult" },
    { k: "Type", v: "required", required: true },
    { k: "Expiration", v: "required", required: true },
  ] satisfies SpecRow[],
  listingSetup: [
    { k: "Category", v: "Pet supplies › Treats" },
    { k: "Condition", v: "New" },
    { k: "Format", v: "Buy It Now" },
    { k: "Duration", v: "GTC · auto-relist" },
    { k: "Quantity", v: "10" },
    { k: "List price", v: "$48.00" },
    { k: "Shipping", v: "Free · 2-day" },
    { k: "Handling", v: "1 day" },
    { k: "Returns", v: "30 d · buyer pays" },
  ] satisfies SetupRow[],
  description: {
    heading: "Pedigree DENTASTIX Large Dog Dental Treats — 36 Count",
    bullets: [
      "Clinically proven to reduce plaque and tartar build-up by up to 80%",
      "Unique X-shape and chewy texture cleans down to the gum line",
      "Bacon flavor large dogs love — one stick a day for fresh breath",
      "For adult dogs 30+ lbs · no added sugar, artificial flavors or colors",
    ],
    appended: "+ Shipping · Returns · About us appended automatically",
  },
  missingCount: 2,
};
