import { getSeasonalSuggestions } from "./seasonal";

// Evergreen, high-velocity reselling categories FLIP hunts across on its own.
const EVERGREEN = [
  "led strip lights",
  "phone tripod stand",
  "car phone mount",
  "kitchen gadgets set",
  "dog chew toys",
  "cat scratcher",
  "resistance bands set",
  "insulated water bottle",
  "storage bins organizer",
  "desk organizer",
  "garden hose nozzle",
  "camping lantern",
  "makeup brush set",
  "kids art supplies",
  "jigsaw puzzle",
  "grill accessories set",
  "cooler bag",
  "yoga mat",
  "travel pillow",
  "cleaning brush set",
  "spice rack organizer",
  "wall hooks adhesive",
  "reusable food bags",
  "label maker",
];

// Builds the hunt's seed list with zero user input: upcoming-seasonal terms
// first, then a slice of evergreen categories that rotates by the day so each
// hunt explores different ground.
export function buildHuntSeeds(now: Date = new Date(), count = 4): string[] {
  const seasonal = getSeasonalSuggestions(now, 45)
    .flatMap((s) => s.terms)
    .slice(0, 3);

  const startOfYear = new Date(now.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000);
  const start = (dayOfYear * 3) % EVERGREEN.length;
  const rotated = [...EVERGREEN.slice(start), ...EVERGREEN.slice(0, start)];

  return [...new Set([...seasonal, ...rotated])].slice(0, count);
}
