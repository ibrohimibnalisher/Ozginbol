import { describe, expect, it } from "vitest";
import {
  FOODS, INGREDIENTS, RECIPES, computeRecipe, computeTargets, createCustomFood, createRecipeFood, getFood,
  parseCustomFoodLine, parseMeal, recipeLines, searchFoods, sourceText,
} from "../src";

const base = { sex: "male", age: 25, heightCm: 180, weightKg: 80, activity: "moderate" } as const;

describe("goal algorithm", () => {
  it("orders calories cut < lose < maintain < gain and shows its steps", () => {
    const cut = computeTargets({ ...base, goal: "cut", rateKgPerWeek: 0.75 });
    const lose = computeTargets({ ...base, goal: "lose" });
    const keep = computeTargets({ ...base, goal: "maintain" });
    const gain = computeTargets({ ...base, goal: "gain" });
    expect(cut.calories).toBeLessThan(lose.calories);
    expect(lose.calories).toBeLessThan(keep.calories);
    expect(keep.calories).toBeLessThan(gain.calories);
    expect(cut.protein).toBe(176); // 2.2 g/kg on sushka
    expect(cut.steps[0]).toContain("Mifflin-St Jeor");
    expect(cut.steps.join("\n")).toContain("7700");
  });

  it("caps unsafe rates and warns", () => {
    const t = computeTargets({ ...base, goal: "lose", rateKgPerWeek: 2 });
    expect(t.dailyDelta).toBeGreaterThanOrEqual(-Math.round(t.tdee * 0.25) - 10);
    expect(t.warnings.join(" ")).toContain("xavfsiz emas");
  });

  it("predicts weeks to target weight", () => {
    const t = computeTargets({ ...base, goal: "lose", rateKgPerWeek: 0.5, targetWeightKg: 75 });
    expect(t.weeksToTarget).toBe(10);
    const g = computeTargets({ ...base, goal: "gain", rateKgPerWeek: 0.25, targetWeightKg: 85 });
    expect(g.weeksToTarget).toBe(20);
  });

  it("uses Katch-McArdle when body fat is known", () => {
    const t = computeTargets({ ...base, goal: "maintain", bodyFatPct: 15 });
    expect(t.bmrFormula).toBe("katch");
    expect(t.bmr).toBe(Math.round(370 + 21.6 * 68));
  });
});

describe("recipes and sources", () => {
  it("every national-dish recipe uses known ingredients and a sane yield", () => {
    for (const [id, r] of Object.entries(RECIPES)) {
      const raw = r.items.reduce((a, i) => a + i.grams, 0);
      expect(r.yieldG / raw, id).toBeGreaterThan(0.6);
      expect(r.yieldG / raw, id).toBeLessThan(1.3);
      expect(getFood(id)!.per100).toEqual(computeRecipe(r, getFood));
    }
  });

  it("somsa explains where its calories come from", () => {
    const somsa = getFood("somsa")!;
    expect(sourceText(somsa)).toContain("retsept");
    const lines = recipeLines(somsa);
    expect(lines[0]).toContain("Bug'doy uni");
    expect(lines.at(-1)).toContain(`100 g da ${somsa.per100.kcal} kkal`);
  });

  it("every non-recipe food has a source", () => {
    for (const f of FOODS) expect(sourceText(f).length, f.id).toBeGreaterThan(10);
    for (const i of INGREDIENTS) expect(i.ref, i.id).toBeTruthy();
  });
});

describe("sizes", () => {
  it("small / large pieces change grams", () => {
    expect(parseMeal("1 kichik somsa").items[0]!.grams).toBe(90);
    expect(parseMeal("2 ta katta somsa").items[0]!.grams).toBe(360);
    expect(parseMeal("katta kosa lag'mon").items[0]!.grams).toBe(600);
    expect(parseMeal("большая самса").items[0]!.grams).toBe(180);
    // no size table: ±30-40%
    expect(parseMeal("1 katta apelsin").items[0]!.grams).toBe(210);
  });
});

describe("custom foods and recipes", () => {
  it("adds a label product and matches it first", () => {
    const food = createCustomFood({ name: "Agusha tvorog", per100: { kcal: 159, protein: 18, fat: 9, carbs: 2 }, portionGrams: 100 }, "u:agusha");
    const r = parseMeal("2 ta agusha tvorog", { extraFoods: [food] });
    expect(r.items[0]!.food.id).toBe("u:agusha");
    expect(r.items[0]!.nutrition.kcal).toBe(318);
    expect(searchFoods("agusha", 5, [food])[0]!.id).toBe("u:agusha");
  });

  it("converts per-portion labels to per 100 g", () => {
    const food = createCustomFood({ name: "Snickers", perPortion: { kcal: 248, protein: 4, fat: 12, carbs: 31 }, portionGrams: 50 });
    expect(food.per100.kcal).toBe(496);
    expect(() => createCustomFood({ name: "x", per100: { kcal: 2000, protein: 0, fat: 0, carbs: 0 } })).toThrow();
  });

  it("builds a recipe from raw ingredients", () => {
    const { food } = createRecipeFood({ name: "Uy oshi", ingredients: "1 kg guruch, 1 kg mol go'shti, 250 g yog', 1 kg sabzi, 300 g piyoz", yieldG: 4500, servings: 12 });
    expect(food.recipe!.items.map((i) => i.id)).toEqual(["x_guruch", "x_mol", "x_yog", "x_sabzi", "x_piyoz"]);
    expect(food.per100.kcal).toBe(Math.round((3600 + 2150 + 2210 + 410 + 120) / 45));
    expect(food.portions.porsiya).toBe(375);
  });

  it("reads a one-line product for Telegram", () => {
    expect(parseCustomFoodLine("Agusha tvorog, 159, 18, 9, 2")).toEqual({ name: "Agusha tvorog", per100: { kcal: 159, protein: 18, fat: 9, carbs: 2 }, portionGrams: undefined });
    expect(parseCustomFoodLine("Mening nonim; 250; 8; 3; 48; dona 300")!.portionGrams).toBe(300);
    expect(parseCustomFoodLine("faqat nom")).toBeNull();
  });
});
