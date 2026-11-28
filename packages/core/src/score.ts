import type { Targets } from "./goals";
import type { Macros } from "./types";

export interface DayScore {
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "E";
  good: string[];
  improve: string[];
}

/**
 * Day quality (Yazio / Lose It style), 100 points:
 * calories 35, protein 25, fat in range 10, fibre-rich & sweets share 15, water 15.
 */
export function dayScore(food: Macros, t: Targets, opts: { burned?: number; waterMl?: number; sweetsKcal?: number; plantsKcal?: number } = {}): DayScore {
  const good: string[] = [];
  const improve: string[] = [];
  const budget = t.calories + (opts.burned ?? 0);
  let s = 0;

  const dev = Math.abs(food.kcal - budget) / budget;
  const kcalPts = dev <= 0.1 ? 35 : dev <= 0.2 ? 25 : dev <= 0.3 ? 12 : 0;
  s += kcalPts;
  if (kcalPts === 35) good.push("Kaloriya me'yorda");
  else improve.push(food.kcal > budget ? `Kaloriya me'yordan ${Math.round(food.kcal - budget)} kkal ko'p` : `Kaloriya me'yordan ${Math.round(budget - food.kcal)} kkal kam`);

  const pr = food.protein / t.protein;
  const prPts = Math.round(25 * Math.min(1, pr / 0.9));
  s += prPts;
  if (pr >= 0.9) good.push("Oqsil yetarli");
  else improve.push(`Oqsil yana ${Math.round(t.protein - food.protein)} g kerak`);

  const fr = food.fat / t.fat;
  const fatPts = fr >= 0.6 && fr <= 1.25 ? 10 : fr <= 1.5 ? 5 : 0;
  s += fatPts;
  if (fr > 1.25) improve.push("Yog' ko'p: qovurilgan va yog'li taomni kamaytiring");

  const sweets = (opts.sweetsKcal ?? 0) / Math.max(1, food.kcal);
  const plants = (opts.plantsKcal ?? 0) / Math.max(1, food.kcal);
  const qPts = Math.round(Math.max(0, 10 - sweets * 50) + Math.min(5, plants * 50));
  s += qPts;
  if (sweets > 0.15) improve.push("Shirinlik va fastfud kaloriyaning 15% dan ko'pi");
  if (plants >= 0.1) good.push("Meva va sabzavot bor");
  else improve.push("Meva yoki sabzavot qo'shing");

  const wr = (opts.waterMl ?? 0) / t.waterMl;
  const wPts = Math.round(15 * Math.min(1, wr));
  s += wPts;
  if (wr >= 1) good.push("Suv me'yori bajarildi");
  else improve.push(`Yana ${((t.waterMl - (opts.waterMl ?? 0)) / 1000).toFixed(1)} l suv iching`);

  const score = Math.max(0, Math.min(100, s));
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E";
  return { score, grade, good, improve };
}
