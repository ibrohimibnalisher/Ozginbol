import type { Lang } from "./types";

export interface Exercise {
  id: string;
  name: Record<Lang, string>;
  /** Metabolic equivalent (Compendium of Physical Activities, 2024). */
  met: number;
}

export const EXERCISES: Exercise[] = [
  { id: "walk", name: { uz: "Piyoda yurish (o'rtacha)", ru: "Ходьба (средний темп)", en: "Walking, moderate" }, met: 3.5 },
  { id: "walk_fast", name: { uz: "Tez yurish", ru: "Быстрая ходьба", en: "Brisk walking" }, met: 4.8 },
  { id: "run", name: { uz: "Yugurish (8 km/soat)", ru: "Бег (8 км/ч)", en: "Running, 8 km/h" }, met: 8.3 },
  { id: "run_fast", name: { uz: "Yugurish (11 km/soat)", ru: "Бег (11 км/ч)", en: "Running, 11 km/h" }, met: 11 },
  { id: "bike", name: { uz: "Velosiped", ru: "Велосипед", en: "Cycling, moderate" }, met: 7.5 },
  { id: "swim", name: { uz: "Suzish", ru: "Плавание", en: "Swimming" }, met: 7 },
  { id: "gym", name: { uz: "Trenajyor zali (kuch mashqlari)", ru: "Силовая тренировка", en: "Weight training" }, met: 5 },
  { id: "football", name: { uz: "Futbol", ru: "Футбол", en: "Football" }, met: 7 },
  { id: "volleyball", name: { uz: "Voleybol", ru: "Волейбол", en: "Volleyball" }, met: 4 },
  { id: "basketball", name: { uz: "Basketbol", ru: "Баскетбол", en: "Basketball" }, met: 6.5 },
  { id: "jump_rope", name: { uz: "Arg'amchi sakrash", ru: "Скакалка", en: "Jump rope" }, met: 11 },
  { id: "yoga", name: { uz: "Yoga", ru: "Йога", en: "Yoga" }, met: 2.5 },
  { id: "hiit", name: { uz: "HIIT / kardio mashq", ru: "HIIT / кардио", en: "HIIT / circuit" }, met: 8 },
  { id: "stairs", name: { uz: "Zinadan chiqish", ru: "Подъём по лестнице", en: "Stair climbing" }, met: 8.8 },
  { id: "dance", name: { uz: "Raqs", ru: "Танцы", en: "Dancing" }, met: 5 },
  { id: "housework", name: { uz: "Uy yumushlari", ru: "Уборка дома", en: "Housework" }, met: 3.3 },
];

/** Calories burned: MET × body weight (kg) × hours. */
export function caloriesBurned(exerciseId: string, weightKg: number, minutes: number): number {
  const ex = EXERCISES.find((e) => e.id === exerciseId);
  if (!ex) throw new Error(`Unknown exercise: ${exerciseId}`);
  return Math.round(ex.met * weightKg * (minutes / 60));
}

/** Minutes of an exercise needed to burn `kcal`. Handy for "1 somsa = 40 min walking". */
export function minutesToBurn(exerciseId: string, weightKg: number, kcal: number): number {
  const ex = EXERCISES.find((e) => e.id === exerciseId);
  if (!ex) throw new Error(`Unknown exercise: ${exerciseId}`);
  return Math.round((kcal / (ex.met * weightKg)) * 60);
}

const EXERCISE_WORDS: [RegExp, string][] = [
  [/tez yur|brisk|быстр/, "walk_fast"],
  [/yugur|beg|бег|run|jog/, "run"],
  [/yur|piyoda|ходьб|прогул|walk|qadam/, "walk"],
  [/velo|велос|bike|cycl/, "bike"],
  [/suz|плав|swim|basseyn|бассейн/, "swim"],
  [/zal|trenaj|kuch|штанг|силов|тренаж|gym|weight|shtanga/, "gym"],
  [/futbol|футбол|football|soccer/, "football"],
  [/voleybol|волейбол|volleyball/, "volleyball"],
  [/basketbol|баскетбол|basketball/, "basketball"],
  [/arg'amchi|argamchi|скакал|skakal|rope/, "jump_rope"],
  [/yoga|йога/, "yoga"],
  [/hiit|kardio|кардио|cardio|krossfit|кроссфит/, "hiit"],
  [/zina|лестниц|stair/, "stairs"],
  [/raqs|танц|dance/, "dance"],
  [/uy yumush|уборк|tozala|house/, "housework"],
];

/** "30 daqiqa yugurdim" -> { exercise: run, minutes: 30 }. Minutes default to 30. */
export function parseExercise(text: string): { exercise: Exercise; minutes: number } | null {
  const t = text.toLowerCase().replace(/[‘’ʻʼ`]/g, "'");
  const found = EXERCISE_WORDS.find(([re]) => re.test(t));
  if (!found) return null;
  const exercise = EXERCISES.find((e) => e.id === found[1])!;
  const hours = t.match(/(\d+(?:[.,]\d+)?)\s*(soat|час|h\b|hour)/);
  const mins = t.match(/(\d+(?:[.,]\d+)?)/);
  let minutes = 30;
  if (hours) minutes = parseFloat(hours[1]!.replace(",", ".")) * 60;
  else if (mins) minutes = parseFloat(mins[1]!.replace(",", "."));
  if (!(minutes > 0 && minutes <= 600)) return null;
  return { exercise, minutes: Math.round(minutes) };
}
