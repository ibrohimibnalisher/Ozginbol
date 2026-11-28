import type { Food } from "@ozginbol/core";
import { createCustomFood } from "@ozginbol/core";

/** Subset of an Open Food Facts product we use. */
export interface OffProduct {
  product_name?: string;
  product_name_ru?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

const num = (v: unknown): number => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN);

/** Turn an Open Food Facts product into a food, or null when it has no calories. */
export function offToFood(code: string, p: OffProduct): Food | null {
  const n = p.nutriments ?? {};
  let kcal = num(n["energy-kcal_100g"]);
  if (!Number.isFinite(kcal)) kcal = num(n["energy_100g"]) / 4.184; // kJ -> kcal
  if (!Number.isFinite(kcal)) return null;
  const name = [p.product_name || p.product_name_ru, p.brands?.split(",")[0]].filter(Boolean).join(", ") || `Mahsulot ${code}`;
  const serving = num(p.serving_quantity);
  try {
    const food = createCustomFood(
      {
        name,
        per100: {
          kcal: Math.round(kcal),
          protein: Math.round((num(n["proteins_100g"]) || 0) * 10) / 10,
          fat: Math.round((num(n["fat_100g"]) || 0) * 10) / 10,
          carbs: Math.round((num(n["carbohydrates_100g"]) || 0) * 10) / 10,
        },
        portionGrams: Number.isFinite(serving) && serving > 0 ? serving : undefined,
      },
      `off:${code}`,
    );
    return { ...food, ref: `Open Food Facts ochiq bazasi, shtrix-kod ${code} (yorliqdagi qiymat)`, source: "label" };
  } catch {
    return null;
  }
}

export async function lookupBarcode(code: string): Promise<Food | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_ru,brands,serving_quantity,nutriments`;
  const res = await fetch(url, { headers: { "User-Agent": "Ozginbol/0.1 (calorie tracker app)" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return offToFood(code, data.product);
}
