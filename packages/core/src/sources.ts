import { getFood } from "./foods";
import { t } from "./i18n";
import type { Food, Lang, SizeKey } from "./types";

export const SIZE_LABELS: Record<SizeKey, string> = { kichik: "kichik", orta: "o'rta", katta: "katta" };

/** Where a food's numbers come from, in plain Uzbek. */
export function sourceText(f: Food, lang: Lang = "uz"): string {
  const tr = (x: string) => t(lang, x);
  switch (f.source) {
    case "recipe":
      return tr("O'zbek oshxonasining odatiy retsepti bo'yicha hisoblangan: har bir masalliq (asosan USDA bazasi) og'irligi bo'yicha qo'shilib, tayyor taom og'irligiga bo'lingan.");
    case "usda":
      return f.ref ? tr(f.ref) : tr("USDA FoodData Central (AQSh Qishloq xo'jaligi vazirligining rasmiy oziq-ovqat tarkibi bazasi).");
    case "ru-table":
      return f.ref ? tr(f.ref) : tr("Rus oziq-ovqat kimyoviy tarkibi jadvallari (Skurikhin, Tutelyan) bo'yicha.");
    case "label":
      return f.ref ? tr(f.ref) : tr("Do'kondagi mahsulot yorliqlarining o'rtacha qiymati.");
    case "user":
      return f.ref ? tr(f.ref) : tr("Siz kiritgan qiymat.");
  }
}

/** "500 g Bug'doy uni: 1820 kkal" lines for a recipe dish, plus the yield line. */
export function recipeLines(f: Food, lang: Lang = "uz"): string[] {
  if (!f.recipe) return [];
  const lines = f.recipe.items.map((it) => {
    const ing = getFood(it.id);
    const kcal = ing ? Math.round((ing.per100.kcal * it.grams) / 100) : 0;
    return `${it.grams} g ${ing?.name[lang] ?? it.id}: ${kcal} ${t(lang, "kkal")}`;
  });
  const total = f.recipe.items.reduce((a, it) => a + ((getFood(it.id)?.per100.kcal ?? 0) * it.grams) / 100, 0);
  lines.push(t(lang, "Jami {total} kkal ÷ tayyor taom {y} g = 100 g da {kcal} kkal", { total: Math.round(total), y: f.recipe.yieldG, kcal: f.per100.kcal }));
  return lines;
}
