import { getSeasonalSuggestions } from "./seasonal";

// Niche/hobby/tool categories FLIP hunts across on its own. These carry real
// Amazon->eBay spread (eBay buyers pay a premium for specialty gear) — unlike
// commodity home goods, where eBay just matches Amazon. A live mini-hunt across
// these surfaced genuine winners (e.g. baitcaster reels, +$10 net).
const EVERGREEN = [
  "baitcaster fishing reel",
  "spinning fishing reel",
  "fishing tackle kit",
  "tactical flashlight rechargeable",
  "hair clippers cordless",
  "massage gun deep tissue",
  "mechanical keyboard",
  "dash cam",
  "metal detector",
  "pickleball paddle",
  "knife sharpener",
  "binoculars",
  "multitool pliers",
  "fishing lures kit",
  "walkie talkie",
  "tire inflator portable",
  "tool organizer",
  "soldering kit",
  "laser level",
  "trail camera",
  "ratchet straps",
  "car detailing kit",
  "archery release aid",
  "fishfinder",
];

// Builds the hunt's seed list with zero user input: upcoming-seasonal terms
// first, then a slice of evergreen categories that rotates by the day so each
// hunt explores different ground.
export function buildHuntSeeds(now: Date = new Date(), count = 4): string[] {
  // At most one seasonal seed — seasonal decor is mostly commodity with no
  // spread, so let the niche evergreen categories drive the hunt.
  const seasonal = getSeasonalSuggestions(now, 45)
    .flatMap((s) => s.terms)
    .slice(0, 1);

  const startOfYear = new Date(now.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000);
  const start = (dayOfYear * 3) % EVERGREEN.length;
  const rotated = [...EVERGREEN.slice(start), ...EVERGREEN.slice(0, start)];

  return [...new Set([...seasonal, ...rotated])].slice(0, count);
}
