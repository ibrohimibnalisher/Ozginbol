import type { AdaptiveResult, DayScore, Food, HabitStats, Macros, ParsedItem, Profile, Targets, UnitKey } from "@ozginbol/core";
import { adaptiveTdee, caloriesBurned, computeTargets, dayScore, getFood } from "@ozginbol/core";

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

export interface BodyMeasurement {
  day: string;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
  weightKg: number;
  bodyFatPct: number;
}

export interface Fast {
  startedAt: number;
  endedAt: number;
  hours: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  /** Typed inputs joined with ", ": goes back through the parser, so it follows the user's custom foods. */
  text: string;
}

export interface Settings {
  reminders: boolean;
  fastingHours: number;
  stepGoal: number;
}

export interface DiaryState {
  version: 1;
  profile: Profile | null;
  entries: DiaryEntry[];
  water: Record<string, number>;
  weights: { day: string; kg: number }[];
  workouts: Workout[];
  /** The user's own products, recipes and scanned barcodes. */
  customFoods: Food[];
  /** Tape measurements (neck, waist, hip) with US Navy body fat. */
  measurements: BodyMeasurement[];
  fasting: { active: { startedAt: number; hours: number } | null; history: Fast[] };
  savedMeals: SavedMeal[];
  steps: Record<string, number>;
  settings: Settings;
}

export const EMPTY: DiaryState = { version: 1, profile: null, entries: [], water: {}, weights: [], workouts: [],
  customFoods: [],
  measurements: [],
  fasting: { active: null, history: [] },
  savedMeals: [],
  steps: {},
  settings: { reminders: false, fastingHours: 16, stepGoal: 10000 },
};

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
  | { type: "saveFood"; food: Food }
  | { type: "removeFood"; id: string }
  | { type: "measure"; m: BodyMeasurement }
  | { type: "fastStart"; at: number; hours: number }
  | { type: "fastEnd"; at: number }
  | { type: "copyMeal"; fromDay: string; toDay: string; meal: MealType }
  | { type: "saveMeal"; name: string; text: string }
  | { type: "removeSavedMeal"; id: string }
  | { type: "steps"; day: string; steps: number }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "removeMeasure"; day: string }
  | { type: "reset" };

export function reducer(s: DiaryState, a: Action): DiaryState {
  switch (a.type) {
    case "load":
      return { ...EMPTY, ...a.state, settings: { ...EMPTY.settings, ...(a.state.settings ?? {}) }, fasting: a.state.fasting ?? EMPTY.fasting };
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
    case "saveFood": {
      const name = a.food.name.uz.toLowerCase();
      return { ...s, customFoods: [...s.customFoods.filter((f) => f.id !== a.food.id && f.name.uz.toLowerCase() !== name), a.food] };
    }
    case "removeFood":
      return { ...s, customFoods: s.customFoods.filter((f) => f.id !== a.id) };
    case "measure": {
      const measurements = s.measurements.filter((x) => x.day !== a.m.day).concat(a.m).sort((x, y) => x.day.localeCompare(y.day));
      const latest = measurements[measurements.length - 1]!.day === a.m.day;
      const next = latest ? reducer(s, { type: "weight", day: a.m.day, kg: a.m.weightKg }) : s;
      return { ...next, measurements, profile: next.profile && latest ? { ...next.profile, bodyFatPct: a.m.bodyFatPct } : next.profile };
    }
    case "removeMeasure":
      return { ...s, measurements: s.measurements.filter((x) => x.day !== a.day) };
    case "fastStart":
      return { ...s, fasting: { ...s.fasting, active: { startedAt: a.at, hours: a.hours } }, settings: { ...s.settings, fastingHours: a.hours } };
    case "fastEnd": {
      const f = s.fasting.active;
      if (!f) return s;
      const fast: Fast = { startedAt: f.startedAt, endedAt: a.at, hours: f.hours };
      return { ...s, fasting: { active: null, history: [...s.fasting.history, fast].slice(-100) } };
    }
    case "copyMeal": {
      const at = Date.now();
      const src = s.entries.filter((e) => e.day === a.fromDay && e.meal === a.meal);
      return { ...s, entries: [...s.entries, ...src.map((e) => ({ ...e, id: uid(), day: a.toDay, at }))] };
    }
    case "saveMeal": {
      const name = a.name.trim() || a.text.slice(0, 30);
      return { ...s, savedMeals: [...s.savedMeals.filter((m) => m.text !== a.text), { id: uid(), name, text: a.text }].slice(-20) };
    }
    case "removeSavedMeal":
      return { ...s, savedMeals: s.savedMeals.filter((m) => m.id !== a.id) };
    case "steps":
      return { ...s, steps: { ...s.steps, [a.day]: Math.max(0, Math.round(a.steps)) } };
    case "settings":
      return { ...s, settings: { ...s.settings, ...a.patch } };
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

/** Calories from walking, informational only: the activity factor already counts everyday steps. */
export function stepsKcal(steps: number, weightKg: number): number {
  return Math.round(steps * weightKg * 0.0005);
}

/** Calorie budget for one meal, from the usual split of the day. */
export const MEAL_SHARE: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.28, snack: 0.12 };

function isPlant(foodId: string) {
  const c = getFood(foodId)?.category;
  return c === "meva" || c === "sabzavot";
}
function isSweet(foodId: string) {
  const c = getFood(foodId)?.category;
  return c === "shirinlik" || c === "fastfud" || foodId === "kola" || foodId === "sharbat";
}

export function quality(s: DiaryState, day: string): DayScore | null {
  const t = targetsOf(s);
  const sum = summarize(s, day);
  if (!t || !sum.entries.length) return null;
  return dayScore(sum.food, t, {
    burned: sum.burned,
    waterMl: sum.waterMl,
    plantsKcal: sum.entries.filter((e) => isPlant(e.foodId)).reduce((a, e) => a + e.kcal, 0),
    sweetsKcal: sum.entries.filter((e) => isSweet(e.foodId)).reduce((a, e) => a + e.kcal, 0),
  });
}

export function adaptive(s: DiaryState, today = dayKey()): AdaptiveResult | null {
  const byDay = new Map<string, number>();
  for (const e of s.entries) byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.kcal);
  return adaptiveTdee([...byDay].map(([day, kcal]) => ({ day, kcal })), s.weights, 28, today);
}

export function habitStats(s: DiaryState, today = dayKey()): HabitStats {
  const t = targetsOf(s);
  const days = [...new Set(s.entries.map((e) => e.day))].sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const d of days) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  const sums = days.map((d) => summarize(s, d));
  const w = s.weights;
  return {
    streak: streak(s, today),
    bestStreak: best,
    daysLogged: days.length,
    entries: s.entries.length,
    waterGoalDays: t ? Object.values(s.water).filter((ml) => ml >= t.waterMl).length : 0,
    proteinGoalDays: t ? sums.filter((d) => d.food.protein >= t.protein * 0.9).length : 0,
    calorieGoalDays: t ? sums.filter((d) => Math.abs(d.food.kcal - (t.calories + d.burned)) <= t.calories * 0.1).length : 0,
    measurements: s.measurements.length,
    weighIns: w.length,
    weightChangeKg: w.length > 1 ? w[w.length - 1]!.kg - w[0]!.kg : 0,
    fastsCompleted: s.fasting.history.filter((f) => f.endedAt - f.startedAt >= f.hours * 3600000).length,
    workouts: s.workouts.length,
    customFoods: s.customFoods.length,
  };
}

/** Diary as CSV (Excel opens it), one row per entry. */
export function toCsv(s: DiaryState): string {
  const meal = Object.fromEntries(MEALS.map((m) => [m.id, m.label]));
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [...s.entries]
    .sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at)
    .map((e) => [e.day, meal[e.meal], q(e.name), e.grams, Math.round(e.kcal), e.protein.toFixed(1), e.fat.toFixed(1), e.carbs.toFixed(1)].join(","));
  return ["Sana,Ovqat,Taom,Gramm,Kkal,Oqsil,Yog',Uglevod", ...rows].join("\n");
}
