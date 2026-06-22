// Built-in event calendar → suggested search terms. No API, no cost.
// Surfaces events coming up within a window so you can source ahead of demand.

export type SeasonalSuggestion = {
  event: string;
  daysAway: number;
  terms: string[];
};

type Event = { event: string; month: number; day: number; terms: string[] };

const EVENTS: Event[] = [
  { event: "New Year", month: 1, day: 1, terms: ["fitness tracker", "planner 2026", "water bottle", "resistance bands"] },
  { event: "Valentine's Day", month: 2, day: 14, terms: ["valentines gift", "couples", "jewelry", "chocolate gift box"] },
  { event: "St. Patrick's Day", month: 3, day: 17, terms: ["st patricks day", "green party decor", "shamrock"] },
  { event: "Easter", month: 4, day: 5, terms: ["easter basket", "easter egg", "spring decor", "kids easter"] },
  { event: "Mother's Day", month: 5, day: 10, terms: ["mothers day gift", "jewelry", "spa gift set", "flowers vase"] },
  { event: "Father's Day", month: 6, day: 15, terms: ["fathers day gift", "grill tools", "multi tool", "mens watch"] },
  { event: "Independence Day", month: 7, day: 4, terms: ["american flag", "patriotic decor", "grill", "patio", "cooler", "fireworks party"] },
  { event: "Back to School", month: 8, day: 15, terms: ["backpack", "lunch box", "school supplies", "kids headphones", "binder"] },
  { event: "Halloween", month: 10, day: 31, terms: ["halloween costume", "halloween decor", "candy bucket", "led pumpkin"] },
  { event: "Thanksgiving", month: 11, day: 26, terms: ["turkey roaster", "thanksgiving decor", "serving platter", "tablecloth"] },
  { event: "Black Friday", month: 11, day: 27, terms: ["headphones", "air fryer", "toys deal", "smart watch"] },
  { event: "Christmas", month: 12, day: 25, terms: ["christmas decor", "advent calendar", "kids toys", "christmas lights", "stocking stuffers"] },
];

export function getSeasonalSuggestions(
  now: Date = new Date(),
  windowDays = 45,
): SeasonalSuggestion[] {
  const year = now.getFullYear();
  const out: SeasonalSuggestion[] = [];
  for (const e of EVENTS) {
    let target = new Date(year, e.month - 1, e.day);
    let days = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
    if (days < 0) {
      target = new Date(year + 1, e.month - 1, e.day);
      days = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
    }
    if (days <= windowDays) {
      out.push({ event: e.event, daysAway: days, terms: e.terms });
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}
