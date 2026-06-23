// Product categories FLIP refuses to surface as winners, because they're a bad
// fit for Amazon -> eBay dropshipping:
//   - cosmetics / beauty consumables (gated, expire, authenticity/VeRO risk)
//   - breakable goods, esp. glass/ceramic (shatter in transit -> returns/losses)
//   - food & dietary supplements (expiry, FDA/eBay restrictions, gated)
//
// Matched whole-word against the lowercased title (see isExcludedCategory), and
// deliberately precision-first: terms were stress-tested so they don't catch
// durable lookalikes ("coffee table", "reusable food bags", "spice rack",
// "sunglasses", "makeup brush set", aquarium accessories, etc.). Tune over time.

const COSMETICS = [
  "lipstick", "matte lipstick", "liquid lipstick", "lip gloss", "lip liner",
  "lip stain", "lip plumper", "mascara", "eyeliner", "liquid eyeliner",
  "gel eyeliner", "kohl pencil", "eyeshadow", "eye shadow", "eyeshadow palette",
  "concealer", "under eye concealer", "color corrector", "foundation makeup",
  "makeup foundation", "liquid foundation", "setting powder", "loose powder",
  "pressed powder", "bb cream", "cc cream", "tinted moisturizer", "blush makeup",
  "bronzer", "highlighter makeup", "contour palette", "makeup palette",
  "makeup primer", "lash primer", "brow pencil", "brow gel", "brow pomade",
  "nail polish", "gel polish", "nail lacquer", "cuticle oil", "face serum",
  "facial serum", "vitamin c serum", "hyaluronic serum", "facial moisturizer",
  "night cream", "eye cream", "anti-aging cream", "retinol cream", "sunscreen",
  "sunblock", "self tanner", "face wash", "facial cleanser", "face toner",
  "sheet mask", "makeup remover", "micellar water", "perfume", "eau de parfum",
  "eau de toilette", "cologne", "fragrance mist",
];

const BREAKABLE = [
  "glassware", "drinking glassware", "wine glass", "wine glasses",
  "drinking glass", "drinking glasses", "shot glass", "glass tumbler",
  "glass jar", "glass bottle", "glass vase", "glass bowl", "glass pitcher",
  "glass teapot", "glass canister", "glass food storage", "glass storage container",
  "stemware", "champagne flute", "wine decanter", "decanter", "mason jar",
  "ceramic vase", "ceramic bowl", "ceramic plate", "ceramic mug", "ceramic teapot",
  "porcelain", "porcelain doll", "lead crystal", "crystal vase", "crystal glass",
  "wall mirror", "vanity mirror", "makeup mirror", "light bulb", "light bulbs",
  "led bulb", "incandescent bulb", "fish tank", "terrarium", "figurine",
  "snow globe", "beer mug",
];

const FOOD_SUPPLEMENTS = [
  "dietary supplement", "nutritional supplement", "herbal supplement",
  "weight loss supplement", "fiber supplement", "vitamins", "multivitamin",
  "gummy vitamins", "fish oil", "fish oil softgels", "omega-3", "protein powder",
  "whey protein", "whey isolate", "mass gainer", "protein bar", "protein shake",
  "protein cookie", "meal replacement", "creatine", "collagen powder",
  "collagen peptides", "probiotics", "probiotic capsules", "prebiotic",
  "melatonin", "electrolyte powder", "electrolyte tablets", "greens powder",
  "bcaa", "amino acids", "ashwagandha", "turmeric capsules", "glucosamine",
  "biotin gummies", "magnesium glycinate", "appetite suppressant",
  "apple cider vinegar", "sea moss gummies", "coffee beans", "ground coffee",
  "ground espresso", "instant coffee", "coffee pods", "coffee k-cups",
  "green tea extract", "matcha powder", "beef jerky", "beef sticks", "trail mix",
  "granola bar", "fruit snacks", "energy drink",
];

const EXCLUDED = [...COSMETICS, ...BREAKABLE, ...FOOD_SUPPLEMENTS];

// Fragile dishware/decor often puts an adjective between the material and the
// form ("ceramic COFFEE mug", "glass SALAD bowl"), which a fixed phrase misses.
// Flag any fragile material co-occurring with a fragile form. This stays safe on
// durable goods that name only one side: "ceramic frying pan", "ceramic flat
// iron", "tempered glass screen protector", "stainless steel mug" — no pair.
const FRAGILE_MATERIALS = [
  "glass", "ceramic", "porcelain", "crystal", "stoneware", "terracotta",
];
const FRAGILE_FORMS = [
  "mug", "cup", "plate", "plates", "bowl", "bowls", "dish", "dishes",
  "dinnerware", "saucer", "platter", "ramekin", "teapot", "pitcher", "tumbler",
  "carafe", "decanter", "stein", "vase", "jar", "ornament", "figurine",
];

function wordHit(hay: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(hay);
}

// True if the title looks like a cosmetics, breakable/glass, or food/supplement
// product. Whole-word match so "coffee beans" flags but "coffee table" doesn't.
export function isExcludedCategory(title: string): boolean {
  const hay = title.toLowerCase();
  if (EXCLUDED.some((term) => wordHit(hay, term))) return true;
  return (
    FRAGILE_MATERIALS.some((m) => wordHit(hay, m)) &&
    FRAGILE_FORMS.some((f) => wordHit(hay, f))
  );
}
