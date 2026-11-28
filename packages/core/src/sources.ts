import { getFood } from "./foods";
import type { Food, SizeKey } from "./types";

export const SIZE_LABELS: Record<SizeKey, string> = { kichik: "kichik", orta: "o'rta", katta: "katta" };

/** Where a food's numbers come from, in plain Uzbek. */
export function sourceText(f: Food): string {
  switch (f.source) {
    case "recipe":
      return "O'zbek oshxonasining odatiy retsepti bo'yicha hisoblangan: har bir masalliq (asosan USDA bazasi) og'irligi bo'yicha qo'shilib, tayyor taom og'irligiga bo'lingan.";
    case "usda":
      return f.ref ?? "USDA FoodData Central (AQSh Qishloq xo'jaligi vazirligining rasmiy oziq-ovqat tarkibi bazasi).";
    case "ru-table":
      return f.ref ?? "Rus oziq-ovqat kimyoviy tarkibi jadvallari (Skurikhin, Tutelyan) bo'yicha.";
    case "label":
      return f.ref ?? "Do'kondagi mahsulot yorliqlarining o'rtacha qiymati.";
    case "user":
      return f.ref ?? "Siz kiritgan qiymat.";
  }
}

/** "500 g Bug'doy uni: 1820 kkal" lines for a recipe dish, plus the yield line. */
export function recipeLines(f: Food): string[] {
  if (!f.recipe) return [];
  const lines = f.recipe.items.map((it) => {
    const ing = getFood(it.id);
    const kcal = ing ? Math.round((ing.per100.kcal * it.grams) / 100) : 0;
    return `${it.grams} g ${ing?.name.uz ?? it.id}: ${kcal} kkal`;
  });
  const total = f.recipe.items.reduce((a, it) => a + ((getFood(it.id)?.per100.kcal ?? 0) * it.grams) / 100, 0);
  lines.push(`Jami ${Math.round(total)} kkal ÷ tayyor taom ${f.recipe.yieldG} g = 100 g da ${f.per100.kcal} kkal`);
  return lines;
}
