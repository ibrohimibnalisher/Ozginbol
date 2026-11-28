import { getFood } from "./foods";
import { MICRO_KEYS } from "./microdata";
import { roundMicro } from "./recipes";
import type { Food, Lang, Micros } from "./types";
import type { Sex } from "./goals";

export { MICRO_KEYS };
export type MicroKey = (typeof MICRO_KEYS)[number];

export interface MicroInfo {
  unit: "g" | "mg" | "µg";
  name: Record<Lang, string>;
  /** Why it matters, one short line per language. */
  why: Record<Lang, string>;
  /** Uzbek foods that are rich in it. */
  sources: string[];
}

export const MICRO_INFO: Record<MicroKey, MicroInfo> = {
  sugar: { unit: "g", name: { uz: "Shakar (jami)", ru: "Сахара (всего)", en: "Sugars (total)" },
    why: { uz: "Meva va sutdagi tabiiy shakar ham kiradi", ru: "Включая натуральные сахара фруктов и молока", en: "Includes natural sugars from fruit and milk" }, sources: [] },
  sodium: { unit: "mg", name: { uz: "Natriy (tuz)", ru: "Натрий (соль)", en: "Sodium (salt)" },
    why: { uz: "Ko'pi qon bosimini oshiradi. 2300 mg ≈ 1 choy qoshiq tuz", ru: "Избыток повышает давление. 2300 мг ≈ 1 ч. л. соли", en: "Too much raises blood pressure. 2300 mg ≈ 1 tsp salt" }, sources: [] },
  potassium: { unit: "mg", name: { uz: "Kaliy", ru: "Калий", en: "Potassium" },
    why: { uz: "Yurak va qon bosimi uchun, tuz ta'sirini kamaytiradi", ru: "Для сердца и давления, смягчает действие соли", en: "Heart and blood pressure, offsets salt" }, sources: ["mosh", "kartoshka", "o'rik", "banan", "mayiz"] },
  calcium: { unit: "mg", name: { uz: "Kalsiy", ru: "Кальций", en: "Calcium" },
    why: { uz: "Suyak va tish, mushak qisqarishi", ru: "Кости, зубы, работа мышц", en: "Bones, teeth, muscle function" }, sources: ["qatiq", "tvorog", "pishloq", "sut", "bodom"] },
  iron: { unit: "mg", name: { uz: "Temir", ru: "Железо", en: "Iron" },
    why: { uz: "Kamqonlikning oldini oladi, kislorod tashiydi", ru: "Профилактика анемии, перенос кислорода", en: "Prevents anaemia, carries oxygen" }, sources: ["jigar", "mol go'shti", "mosh", "no'xat", "ismaloq"] },
  magnesium: { unit: "mg", name: { uz: "Magniy", ru: "Магний", en: "Magnesium" },
    why: { uz: "Asab, uyqu, mushak tirishishiga qarshi", ru: "Нервы, сон, против судорог", en: "Nerves, sleep, muscle cramps" }, sources: ["bodom", "yong'oq", "mosh", "grechka", "kungaboqar pistasi"] },
  zinc: { unit: "mg", name: { uz: "Rux", ru: "Цинк", en: "Zinc" },
    why: { uz: "Immunitet, teri, testosteron", ru: "Иммунитет, кожа, тестостерон", en: "Immunity, skin, testosterone" }, sources: ["mol go'shti", "qo'y go'shti", "kungaboqar pistasi", "no'xat"] },
  vitA: { unit: "µg", name: { uz: "A vitamini", ru: "Витамин A", en: "Vitamin A" },
    why: { uz: "Ko'rish, teri, immunitet", ru: "Зрение, кожа, иммунитет", en: "Vision, skin, immunity" }, sources: ["sabzi", "qovoq", "jigar", "o'rik", "ismaloq"] },
  vitC: { unit: "mg", name: { uz: "C vitamini", ru: "Витамин C", en: "Vitamin C" },
    why: { uz: "Immunitet, temirni so'rilishiga yordam beradi", ru: "Иммунитет, помогает усвоению железа", en: "Immunity, helps absorb iron" }, sources: ["bulg'or qalampiri", "qulupnay", "apelsin", "karam", "kartoshka"] },
  vitD: { unit: "µg", name: { uz: "D vitamini", ru: "Витамин D", en: "Vitamin D" },
    why: { uz: "Suyak, immunitet. Ovqatdan kam keladi, quyosh nuri asosiy manba", ru: "Кости, иммунитет. Мало в еде, главный источник — солнце", en: "Bones, immunity. Little in food, sunlight is the main source" }, sources: ["baliq", "tuxum", "sariyog'"] },
  vitB12: { unit: "µg", name: { uz: "B12 vitamini", ru: "Витамин B12", en: "Vitamin B12" },
    why: { uz: "Qon va asab tizimi. Faqat hayvon mahsulotlarida", ru: "Кровь и нервная система. Только в животных продуктах", en: "Blood and nerves. Only in animal foods" }, sources: ["jigar", "mol go'shti", "tuxum", "sut"] },
  folate: { unit: "µg", name: { uz: "Folat (B9)", ru: "Фолат (B9)", en: "Folate (B9)" },
    why: { uz: "Qon hosil bo'lishi, homiladorlikda juda muhim", ru: "Кроветворение, очень важен при беременности", en: "Blood formation, key in pregnancy" }, sources: ["mosh", "no'xat", "ismaloq", "yeryong'oq", "kungaboqar pistasi"] },
};

export interface MicroTarget {
  /** Daily amount. For "max" it is an upper limit, for "min" the amount to reach. */
  amount: number | null;
  kind: "min" | "max" | "info";
}

/**
 * Daily reference intakes (RDA / AI) from the US National Academies
 * Dietary Reference Intakes, the same tables NIH Office of Dietary
 * Supplements publishes. Sodium uses the 2300 mg chronic-disease limit.
 */
export function microTargets(p: { sex: Sex; age: number }): Record<MicroKey, MicroTarget> {
  const m = p.sex === "male";
  const teen = p.age < 19;
  const min = (amount: number): MicroTarget => ({ amount, kind: "min" });
  return {
    sugar: { amount: null, kind: "info" },
    sodium: { amount: 2300, kind: "max" },
    potassium: min(teen ? (m ? 3000 : 2300) : m ? 3400 : 2600),
    calcium: min(teen ? 1300 : p.age > 70 || (!m && p.age > 50) ? 1200 : 1000),
    iron: min(teen ? (m ? 11 : 15) : m || p.age > 50 ? 8 : 18),
    magnesium: min(teen ? (m ? 410 : 360) : m ? (p.age <= 30 ? 400 : 420) : p.age <= 30 ? 310 : 320),
    zinc: min(teen ? (m ? 11 : 9) : m ? 11 : 8),
    vitA: min(m ? 900 : 700),
    vitC: min(teen ? (m ? 75 : 65) : m ? 90 : 75),
    vitD: min(p.age > 70 ? 20 : 15),
    vitB12: min(2.4),
    folate: min(400),
  };
}

export function emptyMicros(): Micros {
  return Object.fromEntries(MICRO_KEYS.map((k) => [k, 0])) as unknown as Micros;
}

export function scaleMicros(m: Micros, grams: number): Micros {
  const out = emptyMicros();
  for (const k of MICRO_KEYS) out[k] = (m[k] * grams) / 100;
  return out;
}

export interface MicroTotal {
  micros: Micros;
  /** Share of logged calories whose food has micronutrient data, 0..1. */
  coverage: number;
}

/**
 * Sum micronutrients over logged items. Custom foods without data are
 * skipped, and `coverage` tells how much of the day is accounted for.
 */
export function sumMicros(items: { foodId: string; grams: number; kcal?: number }[], extra: Food[] = []): MicroTotal {
  const own = new Map(extra.map((f) => [f.id, f]));
  const out = emptyMicros();
  let known = 0, all = 0;
  for (const it of items) {
    const f = own.get(it.foodId) ?? getFood(it.foodId);
    const kcal = it.kcal ?? (f ? (f.per100.kcal * it.grams) / 100 : 0);
    all += kcal;
    if (!f?.micros) continue;
    known += kcal;
    for (const k of MICRO_KEYS) out[k] += (f.micros[k] * it.grams) / 100;
  }
  for (const k of MICRO_KEYS) out[k] = roundMicro(out[k]);
  return { micros: out, coverage: all > 0 ? known / all : 1 };
}

export type MicroStatus = "low" | "fair" | "good" | "over" | "info";

export interface MicroRow {
  key: MicroKey;
  amount: number;
  target: number | null;
  kind: MicroTarget["kind"];
  pct: number | null;
  status: MicroStatus;
}

export function microReport(m: Micros, targets: Record<MicroKey, MicroTarget>): MicroRow[] {
  return MICRO_KEYS.map((key) => {
    const t = targets[key];
    const amount = m[key];
    if (t.amount === null) return { key, amount, target: null, kind: t.kind, pct: null, status: "info" as const };
    const pct = Math.round((amount / t.amount) * 100);
    const status: MicroStatus = t.kind === "max" ? (pct > 100 ? "over" : "good") : pct >= 100 ? "good" : pct >= 50 ? "fair" : "low";
    return { key, amount, target: t.amount, kind: t.kind, pct, status };
  });
}

/** "1 200 mg", "2.4 µg", "18 g" in the nutrient's unit. */
export function formatMicro(key: MicroKey, n: number): string {
  const v = n >= 100 ? String(Math.round(n)) : n >= 10 ? (Math.round(n * 10) / 10).toString() : (Math.round(n * 100) / 100).toString();
  return `${v} ${MICRO_INFO[key].unit}`;
}

/**
 * The nutrients most behind target, for a short "eat more of" hint.
 * Ignores the day when too little of it has data.
 */
export function microGaps(rows: MicroRow[], limit = 3): MicroRow[] {
  return rows
    .filter((r) => r.kind === "min" && r.pct !== null && r.pct < 70 && r.key !== "vitD")
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))
    .slice(0, limit);
}
