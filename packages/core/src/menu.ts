import type { Goal } from "./goals";
import type { Macros, ParsedItem } from "./types";
import { parseMeal, scaleMacros, sumMacros } from "./parser";

export type MenuMeal = "breakfast" | "lunch" | "dinner" | "snack";

export const MENU_MEAL_LABELS: Record<MenuMeal, string> = { breakfast: "Nonushta", lunch: "Tushlik", dinner: "Kechki ovqat", snack: "Gazak" };

/** Share of the day's calories per meal. */
const SPLIT: Record<MenuMeal, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.28, snack: 0.12 };

/** Everyday Uzbek meals, written the way people type them, so they go through the normal parser. */
export const MENU_OPTIONS: Record<MenuMeal, string[]> = {
  breakfast: [
    "2 ta tuxum, 1 bo'lak non, 1 pomidor, 1 piyola choy",
    "250 g suli bo'tqasi, 1 banan, 1 piyola choy",
    "200 g tvorog, 1 osh qoshiq asal, 1 olma",
    "qovurilgan tuxum, 1 bo'lak qora non, 1 bodring, 1 piyola choy",
    "150 g suzma, 1 bo'lak non, 30 g yong'oq, 1 piyola choy",
    "2 ta blin, 100 g tvorog, 1 piyola choy",
    "250 g manniy bo'tqa, 1 piyola choy, 1 olma",
  ],
  lunch: [
    "1 porsiya osh, achchiq-chuchuk",
    "1 kosa mastava, 1 bo'lak non",
    "1 kosa lag'mon",
    "200 g tovuq ko'kragi, 200 g grechka, karam salati",
    "1 kosa sho'rva, 1 bo'lak non",
    "4 ta manti, 1 stakan qatiq",
    "1 porsiya dimlama, 1 bo'lak non",
    "2 six tovuq shashlik, achchiq-chuchuk, 1 bo'lak non",
    "1 kosa moshxo'rda",
  ],
  dinner: [
    "200 g tovuq ko'kragi, 200 g sabzavotli salat",
    "200 g baliq, 150 g guruch, 1 bodring",
    "1 kosa chuchvara",
    "2 six mol go'shti shashlik, achchiq-chuchuk",
    "150 g mol go'shti, 200 g kartoshka, 1 pomidor",
    "2 ta kotlet, 200 g grechka, 1 bodring",
    "1 porsiya xonim, 1 stakan qatiq",
    "200 g tvorog, 1 stakan kefir",
  ],
  snack: [
    "1 stakan kefir, 1 olma",
    "30 g bodom, 1 apelsin",
    "1 stakan qatiq, 3 ta xurmo",
    "1 banan, 1 stakan sut",
    "150 g yogurt",
    "100 g tvorog, 1 choy qoshiq asal",
    "1 anor",
  ],
};

export interface MenuItem {
  meal: MenuMeal;
  text: string;
  items: ParsedItem[];
  total: Macros;
}
export interface DayMenu {
  meals: MenuItem[];
  total: Macros;
}

/** Small deterministic PRNG so "another menu" is reproducible in tests. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const parsedCache = new Map<string, ParsedItem[]>();
function parse(text: string): ParsedItem[] {
  let p = parsedCache.get(text);
  if (!p) {
    p = parseMeal(text).items;
    parsedCache.set(text, p);
  }
  return p;
}

function scaleItems(items: ParsedItem[], k: number): ParsedItem[] {
  return items.map((i) => {
    if (i.food.per100.kcal < 5) return i; // tea, water: keep the cup as is
    const grams = Math.max(5, Math.round((i.grams * k) / 5) * 5);
    return { ...i, grams, quantity: Math.round(i.quantity * k * 10) / 10, nutrition: scaleMacros(i.food.per100, grams) };
  });
}

/**
 * Builds a day of meals that hits the calorie target (±5%) and gets as close as possible to the protein
 * target. Portions are scaled within 0.7-1.5×, so meals stay realistic. `seed` picks among the best menus.
 */
export function generateMenu(target: { calories: number; protein: number; goal?: Goal }, seed = 1): DayMenu {
  const rand = rng(seed);
  const meals = Object.keys(SPLIT) as MenuMeal[];
  const candidates: { score: number; picks: MenuItem[] }[] = [];

  for (let attempt = 0; attempt < 400; attempt++) {
    const picks: MenuItem[] = [];
    for (const meal of meals) {
      const opts = MENU_OPTIONS[meal];
      const text = opts[Math.floor(rand() * opts.length)]!;
      const base = parse(text);
      const kcal = sumMacros(base.map((i) => i.nutrition)).kcal;
      const k = Math.min(1.5, Math.max(0.7, (target.calories * SPLIT[meal]) / kcal));
      const items = scaleItems(base, k);
      picks.push({ meal, text, items, total: sumMacros(items.map((i) => i.nutrition)) });
    }
    if (new Set(picks.map((p) => p.text)).size < picks.length) continue;
    const total = sumMacros(picks.map((p) => p.total));
    const kcalErr = Math.abs(total.kcal - target.calories) / target.calories;
    const protShort = Math.max(0, target.protein - total.protein) / target.protein;
    const protWeight = target.goal === "cut" || target.goal === "gain" ? 2 : 1;
    candidates.push({ score: kcalErr * 3 + protShort * protWeight, picks });
  }
  candidates.sort((a, b) => a.score - b.score);
  const pool = candidates.slice(0, 8);
  const best = pool[Math.floor(rand() * pool.length)]!.picks;

  // Final nudge so the day lands on the calorie target.
  const total = sumMacros(best.map((p) => p.total));
  const k = target.calories / total.kcal;
  const meals2 = Math.abs(1 - k) > 0.03
    ? best.map((p) => {
        const items = scaleItems(p.items, k);
        return { ...p, items, total: sumMacros(items.map((i) => i.nutrition)) };
      })
    : best;
  return { meals: meals2, total: sumMacros(meals2.map((p) => p.total)) };
}

/** "200 g Tovuq ko'kragi, 150 g Grechka" — readable line for a menu meal. */
export function menuLine(m: MenuItem): string {
  return m.items.map((i) => `${i.grams} ${i.food.liquid ? "ml" : "g"} ${i.food.name.uz}`).join(", ");
}
