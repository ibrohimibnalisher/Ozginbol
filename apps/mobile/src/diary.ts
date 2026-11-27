import type { Macros, ParsedItem, Profile, Targets, UnitKey } from "@ozginbol/core";
import { caloriesBurned, computeTargets } from "@ozginbol/core";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEALS: { id: MealType; label: string; icon: string }[] = [
  { id: "breakfast", label: "Nonushta", icon: "☀️" },
  { id: "lunch", label: "Tushlik", icon: "🍲" },
  { id: "dinner", label: "Kechki ovqat", icon: "🌙" },
  { id: "snack", label: "Gazak", icon: "🍎" },
];

export interface DiaryEntry extends Macros {
  id: string;
  day: string;
  at: number;
  meal: MealType;
  foodId: string;
  name: string;
  input: string;
  quantity: number;
  unit: UnitKey;
  grams: number;
}

export interface Workout {
  id: string;
  day: string;
  exerciseId: string;
  minutes: number;
  kcal: number;
}

export interface DiaryState {
  version: 1;
  profile: Profile | null;
  entries: DiaryEntry[];
  water: Record<string, number>;
  weights: { day: string; kg: number }[];
  workouts: Workout[];
}

export const EMPTY: DiaryState = { version: 1, profile: null, entries: [], water: {}, weights: [], workouts: [] };

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d + delta));
}

/** Meal slot by time of day, so most users never have to pick it. */
export function mealForHour(h: number): MealType {
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 18) return "snack";
  return "dinner";
}

let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type Action =
  | { type: "load"; state: DiaryState }
  | { type: "setProfile"; profile: Profile }
  | { type: "addItems"; day: string; meal: MealType; items: ParsedItem[] }
  | { type: "removeEntry"; id: string }
  | { type: "water"; day: string; deltaMl: number }
  | { type: "weight"; day: string; kg: number }
  | { type: "workout"; day: string; exerciseId: string; minutes: number }
  | { type: "removeWorkout"; id: string }
  | { type: "reset" };

export function reducer(s: DiaryState, a: Action): DiaryState {
  switch (a.type) {
    case "load":
      return { ...EMPTY, ...a.state };
    case "setProfile": {
      const day = dayKey();
      const weights = s.weights.filter((w) => w.day !== day).concat({ day, kg: a.profile.weightKg }).sort((x, y) => x.day.localeCompare(y.day));
      return { ...s, profile: a.profile, weights };
    }
    case "addItems": {
      const at = Date.now();
      const added: DiaryEntry[] = a.items.map((i) => ({
        id: uid(),
        day: a.day,
        at,
        meal: a.meal,
        foodId: i.food.id,
        name: i.food.name.uz,
        input: i.input,
        quantity: i.quantity,
        unit: i.unit,
        grams: i.grams,
        ...i.nutrition,
      }));
      return { ...s, entries: [...s.entries, ...added] };
    }
    case "removeEntry":
      return { ...s, entries: s.entries.filter((e) => e.id !== a.id) };
    case "water": {
      const v = Math.max(0, (s.water[a.day] ?? 0) + a.deltaMl);
      return { ...s, water: { ...s.water, [a.day]: v } };
    }
    case "weight": {
      if (!(a.kg >= 30 && a.kg <= 300)) return s;
      const weights = s.weights.filter((w) => w.day !== a.day).concat({ day: a.day, kg: a.kg }).sort((x, y) => x.day.localeCompare(y.day));
      const isLatest = weights[weights.length - 1]!.day === a.day;
      return { ...s, weights, profile: s.profile && isLatest ? { ...s.profile, weightKg: a.kg } : s.profile };
    }
    case "workout": {
      const w = s.profile?.weightKg ?? 70;
      const kcal = caloriesBurned(a.exerciseId, w, a.minutes);
      return { ...s, workouts: [...s.workouts, { id: uid(), day: a.day, exerciseId: a.exerciseId, minutes: a.minutes, kcal }] };
    }
    case "removeWorkout":
      return { ...s, workouts: s.workouts.filter((w) => w.id !== a.id) };
    case "reset":
      return EMPTY;
  }
}

export interface DaySummary {
  day: string;
  food: Macros;
  burned: number;
  waterMl: number;
  entries: DiaryEntry[];
  byMeal: Record<MealType, DiaryEntry[]>;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function summarize(s: DiaryState, day: string): DaySummary {
  const entries = s.entries.filter((e) => e.day === day);
  const food = entries.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, fat: a.fat + e.fat, carbs: a.carbs + e.carbs }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 } as Macros,
  );
  const byMeal = { breakfast: [], lunch: [], dinner: [], snack: [] } as Record<MealType, DiaryEntry[]>;
  for (const e of entries) byMeal[e.meal].push(e);
  return {
    day,
    food: { kcal: Math.round(food.kcal), protein: r1(food.protein), fat: r1(food.fat), carbs: r1(food.carbs) },
    burned: s.workouts.filter((w) => w.day === day).reduce((a, w) => a + w.kcal, 0),
    waterMl: s.water[day] ?? 0,
    entries,
    byMeal,
  };
}

export function targetsOf(s: DiaryState): Targets | null {
  return s.profile ? computeTargets(s.profile) : null;
}

/** Foods the user logs most, newest first among ties: powers one-tap re-adding. */
export function frequentInputs(s: DiaryState, limit = 8): string[] {
  const count = new Map<string, { n: number; at: number }>();
  for (const e of s.entries) {
    const k = e.input.trim();
    if (!k) continue;
    const c = count.get(k) ?? { n: 0, at: 0 };
    count.set(k, { n: c.n + 1, at: Math.max(c.at, e.at) });
  }
  return [...count.entries()].sort((a, b) => b[1].n - a[1].n || b[1].at - a[1].at).slice(0, limit).map(([k]) => k);
}

/** Consecutive days (ending today or yesterday) with at least one entry. */
export function streak(s: DiaryState, today = dayKey()): number {
  const days = new Set(s.entries.map((e) => e.day));
  let d = days.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = shiftDay(d, -1);
  }
  return n;
}

export function tips(sum: DaySummary, t: Targets | null, hour = new Date().getHours()): string[] {
  if (!t || !sum.entries.length) return [];
  const out: string[] = [];
  const budget = t.calories + sum.burned;
  if (sum.food.kcal > budget + 100) out.push(`Me'yordan ${Math.round(sum.food.kcal - budget)} kkal oshdi. Kechqurun 30-40 daqiqa tez yurish yordam beradi.`);
  if (hour >= 15 && sum.food.protein < t.protein * 0.5) out.push("Oqsil kam: tuxum, tovuq ko'kragi, tvorog yoki qatiq qo'shing.");
  if (sum.food.fat > t.fat * 1.15) out.push("Yog' ko'p. Osh va somsani yarim porsiya qilib, salat bilan yeng.");
  if (hour >= 14 && sum.waterMl < t.waterMl * 0.5) out.push("Suv kam ichilyapti. Har ovqatdan oldin 1 stakan suv iching.");
  return out.slice(0, 2);
}
