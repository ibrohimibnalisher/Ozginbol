import { normalize } from "./normalize";
import { parseMeal, sumMacros } from "./parser";
import type { Food, Macros, ParseResult } from "./types";

export interface CustomFoodInput {
  name: string;
  /** Nutrition per 100 g (as printed on most labels). */
  per100?: Macros;
  /** Or nutrition for one piece / serving of `portionGrams`. */
  perPortion?: Macros;
  /** Weight of one piece / serving, enables "2 ta ..." for this food. */
  portionGrams?: number;
  liquid?: boolean;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function slug(s: string): string {
  return normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "taom";
}

export function validMacros(m: Macros): boolean {
  const ok = (n: number) => Number.isFinite(n) && n >= 0;
  if (![m.kcal, m.protein, m.fat, m.carbs].every(ok)) return false;
  return m.protein + m.fat + m.carbs <= 100.5 || m.kcal > 0;
}

/** The user's own product, e.g. from a package label. */
export function createCustomFood(input: CustomFoodInput, id?: string): Food {
  const name = input.name.trim();
  if (!name) throw new Error("Nomi kerak");
  let per100 = input.per100;
  if (!per100 && input.perPortion && input.portionGrams) {
    const k = 100 / input.portionGrams;
    const p = input.perPortion;
    per100 = { kcal: Math.round(p.kcal * k), protein: r1(p.protein * k), fat: r1(p.fat * k), carbs: r1(p.carbs * k) };
  }
  if (!per100 || !validMacros(per100)) throw new Error("Kaloriya va makrolar noto'g'ri");
  if (per100.kcal > 900) throw new Error("100 g da 900 kkal dan ko'p bo'lmaydi");
  const hasPortion = !!input.portionGrams && input.portionGrams > 0;
  return {
    id: id ?? `u:${slug(name)}-${Date.now().toString(36)}`,
    name: { uz: name, ru: name, en: name },
    aliases: [name.toLowerCase()],
    category: "boshqa",
    per100,
    portions: hasPortion ? { g: 1, dona: input.portionGrams!, porsiya: input.portionGrams! } : { g: 1 },
    defaultUnit: hasPortion ? "dona" : "g",
    liquid: input.liquid,
    source: "user",
    ref: "Siz kiritgan qiymat",
  };
}

export interface RecipeInput {
  name: string;
  /** Free text: "500 g un, 1 kg qo'y go'shti, 200 g piyoz, 100 g yog'" */
  ingredients: string;
  /** Finished weight in grams. Defaults to the sum of ingredients. */
  yieldG?: number;
  servings?: number;
}

/** Build the user's own dish from raw ingredients, like national dishes in recipes.ts. */
export function createRecipeFood(input: RecipeInput, extraFoods: Food[] = [], id?: string): { food: Food; parsed: ParseResult } {
  const parsed = parseMeal(input.ingredients, { ingredients: true, extraFoods });
  if (!parsed.items.length) throw new Error("Ingrediyentlar topilmadi");
  const raw = parsed.items.reduce((a, i) => a + i.grams, 0);
  const yieldG = input.yieldG && input.yieldG > 0 ? input.yieldG : raw;
  const total = sumMacros(parsed.items.map((i) => i.nutrition));
  const k = 100 / yieldG;
  const per100: Macros = { kcal: Math.round(total.kcal * k), protein: r1(total.protein * k), fat: r1(total.fat * k), carbs: r1(total.carbs * k) };
  const servings = input.servings && input.servings > 0 ? input.servings : 0;
  const portion = servings ? Math.round(yieldG / servings) : 0;
  const name = input.name.trim() || "Mening taomim";
  const food: Food = {
    id: id ?? `u:${slug(name)}-${Date.now().toString(36)}`,
    name: { uz: name, ru: name, en: name },
    aliases: [name.toLowerCase()],
    category: "boshqa",
    per100,
    portions: portion ? { g: 1, porsiya: portion, dona: portion } : { g: 1 },
    defaultUnit: portion ? "porsiya" : "g",
    source: "user",
    ref: "Sizning retseptingiz",
    recipe: { items: parsed.items.map((i) => ({ id: i.food.id, grams: i.grams })), yieldG, note: input.ingredients },
  };
  return { food, parsed };
}

/**
 * Telegram-friendly one-liner: "Tvorog Agusha, 159, 18, 9, 2" (per 100 g: kkal, oqsil, yog', uglevod),
 * optionally "..., 1 dona=150" or "..., porsiya 200".
 */
export function parseCustomFoodLine(line: string): CustomFoodInput | null {
  const parts = line.split(/[;,]/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const name = parts[0]!;
  const nums: number[] = [];
  let portionGrams: number | undefined;
  for (const p of parts.slice(1)) {
    const portion = p.match(/(?:dona|porsiya|portsiya|шт|порция|serving)\D*(\d+(?:\.\d+)?)/i) ?? p.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:li)?\s*(?:dona|porsiya)/i);
    if (portion) {
      portionGrams = parseFloat(portion[1]!);
      continue;
    }
    const n = p.replace(",", ".").match(/\d+(?:\.\d+)?/);
    if (n) nums.push(parseFloat(n[0]));
  }
  if (nums.length < 1) return null;
  const [kcal, protein = 0, fat = 0, carbs = 0] = nums as [number, number?, number?, number?];
  return { name, per100: { kcal, protein, fat, carbs }, portionGrams };
}
