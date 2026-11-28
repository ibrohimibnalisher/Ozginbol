import type { Food, Macros, Micros, Recipe } from "./types";
import { MICRO_KEYS } from "./microdata";

/**
 * Typical Tashkent home / choyxona recipes. Nutrition of each dish is computed
 * from these (sum of ingredients ÷ finished weight), so every number can be
 * checked by hand. Grilled meat (shashlik) is not here: fat drips off on the
 * grill, so a recipe sum would overstate it; those use measured USDA values.
 */
export const RECIPES: Record<string, Recipe> = {
  osh: {
    items: [
      { id: "x_guruch", grams: 1000 }, { id: "x_mol", grams: 1000 }, { id: "x_yog", grams: 250 },
      { id: "x_sabzi", grams: 1000 }, { id: "x_piyoz", grams: 250 }, { id: "x_noxat", grams: 100 },
      { id: "x_sarimsoq", grams: 60 }, { id: "x_suv", grams: 1300 }, { id: "x_tuz", grams: 40 },
    ],
    yieldG: 4600,
    note: "1 kg guruchga 1 kg go'sht, 1 kg sabzi, 250 g yog'. Tayyor osh ~4.6 kg (guruch suvni shimadi).",
  },
  somsa: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_suv", grams: 250 }, { id: "x_yog", grams: 30 },
      { id: "x_qoy", grams: 400 }, { id: "x_dumba", grams: 150 }, { id: "x_piyoz", grams: 400 }, { id: "x_tuz", grams: 12 },
    ],
    yieldG: 1450,
    note: "Xamir 500 g un; qiyma 400 g qo'y go'shti, 150 g dumba, 400 g piyoz. Tandirda pishganda ~15% suv bug'lanadi, ~11 ta somsa.",
  },
  somsa_kokat: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_suv", grams: 250 }, { id: "x_yog", grams: 140 },
      { id: "x_kokat", grams: 600 }, { id: "x_piyoz", grams: 200 }, { id: "x_tuz", grams: 12 },
    ],
    yieldG: 1550,
    note: "Xamir 500 g un; 600 g ko'kat, 200 g piyoz, jami 140 g yog'.",
  },
  somsa_kartoshka: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_suv", grams: 250 }, { id: "x_yog", grams: 30 },
      { id: "x_kartoshka", grams: 600 }, { id: "x_piyoz", grams: 300 }, { id: "x_dumba", grams: 100 }, { id: "x_tuz", grams: 13 },
    ],
    yieldG: 1600,
    note: "Xamir 500 g un; 600 g kartoshka, 300 g piyoz, 100 g dumba.",
  },
  lagmon: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_tuxum", grams: 55 }, { id: "x_suv", grams: 2250 },
      { id: "x_mol", grams: 500 }, { id: "x_yog", grams: 100 }, { id: "x_piyoz", grams: 200 },
      { id: "x_qalampir", grams: 300 }, { id: "x_pomidor", grams: 300 }, { id: "x_kartoshka", grams: 300 },
      { id: "x_sabzi", grams: 150 }, { id: "x_sarimsoq", grams: 30 }, { id: "x_tuz", grams: 35 },
    ],
    yieldG: 4600,
    note: "Cho'zma xamir 500 g un; vaju 500 g mol go'shti, 100 g yog', sabzavotlar va sho'rva. ~10 kosa.",
  },
  qovurma_lagmon: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_tuxum", grams: 55 }, { id: "x_suv", grams: 250 },
      { id: "x_mol", grams: 500 }, { id: "x_yog", grams: 150 }, { id: "x_piyoz", grams: 200 },
      { id: "x_qalampir", grams: 300 }, { id: "x_pomidor", grams: 300 }, { id: "x_sarimsoq", grams: 30 }, { id: "x_tuz", grams: 20 },
    ],
    yieldG: 2600,
    note: "Qaynatilgan cho'zma (500 g un) vaju bilan qovuriladi: 500 g mol go'shti, 150 g yog'.",
  },
  manti: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_suv", grams: 250 },
      { id: "x_qoy", grams: 500 }, { id: "x_dumba", grams: 150 }, { id: "x_piyoz", grams: 600 }, { id: "x_tuz", grams: 15 },
    ],
    yieldG: 1900,
    note: "Xamir 500 g un; qiyma 500 g qo'y go'shti, 150 g dumba, 600 g piyoz. Bug'da ~35 ta manti.",
  },
  manti_qovoq: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_suv", grams: 250 },
      { id: "x_qovoq", grams: 1000 }, { id: "x_piyoz", grams: 300 }, { id: "x_dumba", grams: 100 }, { id: "x_tuz", grams: 15 },
    ],
    yieldG: 2000,
    note: "Xamir 500 g un; 1 kg qovoq, 300 g piyoz, 100 g dumba.",
  },
  chuchvara: {
    items: [
      { id: "x_un", grams: 300 }, { id: "x_tuxum", grams: 55 }, { id: "x_suv", grams: 1150 },
      { id: "x_mol", grams: 300 }, { id: "x_dumba", grams: 50 }, { id: "x_piyoz", grams: 200 }, { id: "x_tuz", grams: 16 },
    ],
    yieldG: 2000,
    note: "Xamir 300 g un; qiyma 300 g mol go'shti, 50 g dumba; sho'rva bilan ~6 kosa.",
  },
  shorva: {
    items: [
      { id: "x_qoy", grams: 800 }, { id: "x_kartoshka", grams: 600 }, { id: "x_sabzi", grams: 300 },
      { id: "x_piyoz", grams: 200 }, { id: "x_pomidor", grams: 200 }, { id: "x_qalampir", grams: 150 },
      { id: "x_noxat", grams: 100 }, { id: "x_suv", grams: 3500 }, { id: "x_tuz", grams: 36 },
    ],
    yieldG: 4800,
    note: "800 g qo'y go'shti, sabzavotlar, no'xat, 3.5 l suv. ~12 kosa.",
  },
  mastava: {
    items: [
      { id: "x_guruch", grams: 200 }, { id: "x_mol", grams: 400 }, { id: "x_yog", grams: 80 },
      { id: "x_kartoshka", grams: 400 }, { id: "x_sabzi", grams: 200 }, { id: "x_piyoz", grams: 150 },
      { id: "x_pomidor", grams: 200 }, { id: "x_qalampir", grams: 100 }, { id: "x_suv", grams: 2500 }, { id: "x_tuz", grams: 28 },
    ],
    yieldG: 3600,
    note: "200 g guruch, 400 g mol go'shti, 80 g yog', sabzavotlar, 2.5 l suv.",
  },
  moshxorda: {
    items: [
      { id: "x_mosh", grams: 300 }, { id: "x_guruch", grams: 150 }, { id: "x_mol", grams: 300 },
      { id: "x_yog", grams: 60 }, { id: "x_piyoz", grams: 150 }, { id: "x_sabzi", grams: 150 },
      { id: "x_pomidor", grams: 150 }, { id: "x_kartoshka", grams: 200 }, { id: "x_suv", grams: 2500 }, { id: "x_tuz", grams: 28 },
    ],
    yieldG: 3600,
    note: "300 g mosh, 150 g guruch, 300 g mol go'shti, 60 g yog', 2.5 l suv.",
  },
  dimlama: {
    items: [
      { id: "x_mol", grams: 700 }, { id: "x_dumba", grams: 100 }, { id: "x_kartoshka", grams: 800 },
      { id: "x_karam", grams: 600 }, { id: "x_sabzi", grams: 300 }, { id: "x_piyoz", grams: 300 },
      { id: "x_pomidor", grams: 300 }, { id: "x_qalampir", grams: 300 }, { id: "x_tuz", grams: 24 },
    ],
    yieldG: 3000,
    note: "700 g mol go'shti, 100 g dumba, qavat-qavat sabzavot, suvsiz dimlanadi.",
  },
  norin: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_tuxum", grams: 110 }, { id: "x_suv", grams: 200 },
      { id: "x_mol", grams: 600 }, { id: "x_piyoz", grams: 100 }, { id: "x_tuz", grams: 12 },
    ],
    yieldG: 1600,
    note: "Xamir 500 g un, 2 tuxum; 600 g qaynatilgan go'sht ingichka to'g'raladi.",
  },
  beshbarmoq: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_tuxum", grams: 55 }, { id: "x_suv", grams: 200 },
      { id: "x_qoy", grams: 1000 }, { id: "x_piyoz", grams: 200 }, { id: "x_tuz", grams: 20 },
    ],
    yieldG: 2400,
    note: "Xamir 500 g un; 1 kg qo'y go'shti, piyozli sho'rva bilan.",
  },
  qozon_kabob: {
    items: [{ id: "x_qoy", grams: 1000 }, { id: "x_kartoshka", grams: 1000 }, { id: "x_yog", grams: 150 }, { id: "x_piyoz", grams: 200 }, { id: "x_tuz", grams: 16 }],
    yieldG: 1900,
    note: "1 kg qo'y go'shti, 1 kg kartoshka, 150 g yog' qozonda qovuriladi.",
  },
  xonim: {
    items: [
      { id: "x_un", grams: 500 }, { id: "x_suv", grams: 250 }, { id: "x_yog", grams: 30 },
      { id: "x_kartoshka", grams: 600 }, { id: "x_piyoz", grams: 300 }, { id: "x_dumba", grams: 100 }, { id: "x_qoy", grams: 300 }, { id: "x_tuz", grams: 15 },
    ],
    yieldG: 1900,
    note: "Xamir 500 g un; 600 g kartoshka, 300 g go'sht, 100 g dumba, 300 g piyoz.",
  },
  achchiq_chuchuk: {
    items: [{ id: "x_pomidor", grams: 500 }, { id: "x_piyoz", grams: 150 }, { id: "x_yog", grams: 10 }, { id: "x_tuz", grams: 5 }],
    yieldG: 660,
    note: "500 g pomidor, 150 g piyoz, 1 choy qoshiq yog'.",
  },
  chalop: {
    items: [{ id: "x_qatiq", grams: 500 }, { id: "x_suv", grams: 300 }, { id: "x_bodring", grams: 200 }, { id: "x_kokat", grams: 30 }, { id: "x_tuz", grams: 6 }],
    yieldG: 1030,
    note: "500 g qatiq, 300 ml suv, bodring va ko'kat.",
  },
};

/** Nutrition per 100 g of finished dish = Σ(ingredient × grams) ÷ yield. */
export function computeRecipe(recipe: Recipe, lookup: (id: string) => Food | undefined): Macros {
  let kcal = 0, protein = 0, fat = 0, carbs = 0, fiber = 0;
  for (const it of recipe.items) {
    const f = lookup(it.id);
    if (!f) throw new Error(`Recipe ingredient not found: ${it.id}`);
    const k = it.grams / 100;
    kcal += f.per100.kcal * k;
    protein += f.per100.protein * k;
    fat += f.per100.fat * k;
    carbs += f.per100.carbs * k;
    fiber += (f.per100.fiber ?? 0) * k;
  }
  const y = recipe.yieldG / 100;
  const r1 = (n: number) => Math.round((n / y) * 10) / 10;
  return { kcal: Math.round(kcal / y), protein: r1(protein), fat: r1(fat), carbs: r1(carbs), fiber: r1(fiber) };
}

/**
 * Vitamins and minerals per 100 g of finished dish, from the same recipe.
 * Returns undefined if any ingredient has no micronutrient data.
 */
export function computeRecipeMicros(recipe: Recipe, lookup: (id: string) => Food | undefined): Micros | undefined {
  const sum = Object.fromEntries(MICRO_KEYS.map((k) => [k, 0])) as unknown as Micros;
  for (const it of recipe.items) {
    const m = lookup(it.id)?.micros;
    if (!m) return undefined;
    for (const k of MICRO_KEYS) sum[k] += (m[k] * it.grams) / 100;
  }
  const y = recipe.yieldG / 100;
  for (const k of MICRO_KEYS) sum[k] = roundMicro(sum[k] / y);
  return sum;
}

export function roundMicro(n: number): number {
  return n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100;
}
