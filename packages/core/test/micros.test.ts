import { describe, expect, it } from "vitest";
import { FOODS, MICRO_KEYS, createRecipeFood, getFood, microGaps, microReport, microTargets, sumMicros } from "../src";

describe("micronutrients", () => {
  it("every built-in food has vitamins and minerals", () => {
    for (const f of FOODS) {
      expect(f.micros, f.id).toBeTruthy();
      for (const k of MICRO_KEYS) expect(f.micros![k], `${f.id}.${k}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("recipe dishes are computed from ingredients, salt included", () => {
    const osh = getFood("osh")!.micros!;
    // 40 g salt × 387.58 mg/g + ingredients, over 4.6 kg
    expect(osh.sodium).toBeGreaterThan(300);
    expect(osh.sodium).toBeLessThan(450);
    expect(osh.vitA).toBeGreaterThan(150); // carrots
    expect(getFood("somsa")!.per100.kcal).toBeGreaterThan(250); // salt does not change calories
  });

  it("targets follow sex and age", () => {
    expect(microTargets({ sex: "female", age: 30 }).iron.amount).toBe(18);
    expect(microTargets({ sex: "male", age: 30 }).iron.amount).toBe(8);
    expect(microTargets({ sex: "female", age: 60 }).calcium.amount).toBe(1200);
    expect(microTargets({ sex: "male", age: 16 }).calcium.amount).toBe(1300);
  });

  it("day report flags salt and gaps", () => {
    const day = sumMicros([{ foodId: "osh", grams: 700 }, { foodId: "non", grams: 200 }, { foodId: "u:mine", grams: 100, kcal: 300 }]);
    expect(day.coverage).toBeLessThan(1);
    expect(day.coverage).toBeGreaterThan(0.8);
    const rows = microReport(day.micros, microTargets({ sex: "male", age: 30 }));
    expect(rows.find((r) => r.key === "sodium")!.status).toBe("over");
    const gaps = microGaps(rows);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.map((g) => g.key)).toContain("calcium");
  });

  it("user recipes get micros too", () => {
    const { food } = createRecipeFood({ name: "Mening oshim", ingredients: "500 g guruch, 500 g go'sht, 500 g sabzi, 100 g yog'" });
    expect(food.micros?.vitA).toBeGreaterThan(100);
  });
});
