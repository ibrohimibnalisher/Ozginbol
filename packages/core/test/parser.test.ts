import { describe, expect, it } from "vitest";
import { FOODS, computeTargets, getFood, minutesToBurn, parseMeal, searchFoods } from "../src";

const ids = (text: string) => parseMeal(text).items.map((i) => i.food.id);

describe("parseMeal", () => {
  it("parses a typical Uzbek meal", () => {
    const r = parseMeal("2 ta somsa, 1 kosa lag'mon va 1 piyola choy");
    expect(r.items.map((i) => [i.food.id, i.quantity, i.unit, i.grams])).toEqual([
      ["somsa", 2, "dona", 260],
      ["lagmon", 1, "kosa", 450],
      ["choy", 1, "piyola", 150],
    ]);
    expect(r.unknown).toEqual([]);
    const kcal = (id: string, g: number) => Math.round((getFood(id)!.per100.kcal * g) / 100);
    expect(r.total.kcal).toBe(kcal("somsa", 260) + kcal("lagmon", 450) + kcal("choy", 150));
  });

  it("handles apostrophe variants and Cyrillic", () => {
    expect(ids("lag‘mon")).toEqual(["lagmon"]);
    expect(ids("lagmon")).toEqual(["lagmon"]);
    expect(ids("ЛАГМАН")).toEqual(["lagmon"]);
    expect(ids("лағмон")).toEqual(["lagmon"]);
    expect(ids("2 самсы")).toEqual(["somsa"]);
    expect(ids("плов")).toEqual(["osh"]);
  });

  it("prefers the most specific dish", () => {
    expect(ids("qovurma lag'mon")).toEqual(["qovurma_lagmon"]);
    expect(ids("ko'katli somsa")).toEqual(["somsa_kokat"]);
    expect(ids("tovuq shashlik 3 six")).toEqual(["shashlik_tovuq"]);
  });

  it("tolerates typos and Uzbek suffixes", () => {
    expect(ids("somas")).toEqual(["somsa"]);
    expect(ids("chuchvra")).toEqual(["chuchvara"]);
    expect(ids("somsalarni yedim")).toEqual(["somsa"]);
  });

  it("reads grams, litres and word numbers", () => {
    const r = parseMeal("osh 300 gr, yarim litr kola, bir yarim kosa mastava, ikki ta tuxum");
    expect(r.items.map((i) => [i.food.id, i.grams])).toEqual([
      ["osh", 300],
      ["kola", 500],
      ["mastava", 600],
      ["tuxum", 110],
    ]);
  });

  it("treats a bare big number as grams", () => {
    expect(parseMeal("guruch 250").items[0]!.grams).toBe(250);
    expect(parseMeal("300g tovuq ko'kragi").items[0]!.grams).toBe(300);
  });

  it("uses one lagan of osh as a big shared plate", () => {
    expect(parseMeal("1 lagan osh").items[0]!.grams).toBe(1000);
  });

  it("handles tablespoons without confusing them with osh", () => {
    const r = parseMeal("1 osh qoshiq yog', 2 choy qoshiq shakar");
    expect(r.items.map((i) => [i.food.id, i.grams])).toEqual([
      ["osimlik_yogi", 14],
      ["shakar", 10],
    ]);
  });

  it("splits on 'bilan' and newlines", () => {
    expect(ids("non bilan choy\n1 olma")).toEqual(["non", "choy", "olma"]);
  });

  it("parses Russian and English", () => {
    expect(ids("2 яйца и стакан кефира")).toEqual(["tuxum", "kefir"]);
    expect(ids("one banana and 2 slices of pizza")).toEqual(["banan", "pitsa"]);
  });

  it("reports unknown foods instead of guessing", () => {
    const r = parseMeal("1 kosa osh, zzqwerty");
    expect(r.items.map((i) => i.food.id)).toEqual(["osh"]);
    expect(r.unknown).toEqual(["zzqwerty"]);
  });
});

describe("food database", () => {
  it("has consistent energy (4/4/9 rule within tolerance)", () => {
    for (const f of FOODS) {
      const { kcal, protein, fat, carbs } = f.per100;
      const est = protein * 4 + carbs * 4 + fat * 9;
      if (kcal < 30 || f.id === "pivo") continue; // alcohol adds 7 kcal/g
      const tolerance = kcal < 50 ? 0.25 : 0.15; // low-energy produce: rounding dominates
      expect(Math.abs(est - kcal) / kcal, `${f.id}: ${kcal} vs ${est.toFixed(0)}`).toBeLessThan(tolerance);
    }
  });

  it("has unique ids and a valid default unit", () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    for (const f of FOODS) expect(f.portions[f.defaultUnit], f.id).toBeGreaterThan(0);
  });

  it("search finds dishes by prefix", () => {
    expect(searchFoods("som").map((f) => f.id)).toContain("somsa");
    expect(searchFoods("лаг")[0]!.id).toBe("lagmon");
  });
});

describe("targets", () => {
  it("computes sane targets", () => {
    const t = computeTargets({ sex: "male", age: 30, heightCm: 178, weightKg: 85, activity: "light", goal: "lose" });
    expect(t.bmr).toBe(1818);
    expect(t.tdee).toBe(2500);
    expect(t.calories).toBe(1950); // 2500 − 0.5 kg/week × 7700 / 7
    expect(t.protein).toBe(153); // 1.8 g/kg
    expect(t.bmiCategory).toBe("overweight");
    expect(t.weeklyChangeKg).toBeLessThan(0);
  });

  it("never goes below the safety floor", () => {
    const t = computeTargets({ sex: "female", age: 60, heightCm: 150, weightKg: 48, activity: "sedentary", goal: "lose" });
    expect(t.calories).toBeGreaterThanOrEqual(Math.min(1200, t.tdee - 10));
    expect(t.warnings.length).toBeGreaterThan(0);
  });

  it("converts food to walking minutes", () => {
    expect(minutesToBurn("walk", 70, 377)).toBe(92);
  });
});

import { parseExercise } from "../src";
describe("parseExercise", () => {
  it("reads exercise and duration", () => {
    expect(parseExercise("30 daqiqa yugurdim")).toMatchObject({ exercise: { id: "run" }, minutes: 30 });
    expect(parseExercise("1 soat piyoda yurdim")).toMatchObject({ exercise: { id: "walk" }, minutes: 60 });
    expect(parseExercise("zal 45")).toMatchObject({ exercise: { id: "gym" }, minutes: 45 });
    expect(parseExercise("tez yurish")).toMatchObject({ exercise: { id: "walk_fast" }, minutes: 30 });
    expect(parseExercise("hech narsa")).toBeNull();
  });
});
