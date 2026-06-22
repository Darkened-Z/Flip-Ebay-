// Brands commonly gated/restricted for resale on eBay/Amazon, or risky for a
// dropship model (frequent IP/VeRO takedowns). Flagged so you don't list them
// without checking approval. Not exhaustive — tune over time.
const RESTRICTED = [
  "nike",
  "adidas",
  "apple",
  "sony",
  "samsung",
  "disney",
  "lego",
  "funko",
  "louis vuitton",
  "gucci",
  "chanel",
  "rolex",
  "lululemon",
  "yeti",
  "stanley",
  "dyson",
  "bose",
  "beats",
  "supreme",
  "the north face",
  "patagonia",
  "under armour",
  "ugg",
  "pandora",
  "kate spade",
  "coach",
  "michael kors",
  "ray-ban",
  "oakley",
  "gopro",
  "nintendo",
  "playstation",
  "xbox",
  "pokemon",
  "build-a-bear",
  "american girl",
  "hasbro",
  "mattel",
];

export function isRestricted(title: string, brand?: string): boolean {
  const hay = `${brand ?? ""} ${title}`.toLowerCase();
  return RESTRICTED.some((b) => hay.includes(b));
}
