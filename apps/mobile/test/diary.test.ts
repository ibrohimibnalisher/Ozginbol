import { describe, expect, it } from "vitest";
import { createCustomFood, parseMeal } from "@ozginbol/core";
import { offToFood } from "../src/barcode";
import { EMPTY, dayKey, frequentInputs, mealForHour, reducer, shiftDay, streak, summarize, targetsOf, tips } from "../src/diary";

const profile = { sex: "male", age: 30, heightCm: 178, weightKg: 85, activity: "light", goal: "lose" } as const;
const today = dayKey();

describe("diary reducer", () => {
  it("adds parsed items into meals and summarizes", () => {
    let s = reducer(EMPTY, { type: "setProfile", profile });
    s = reducer(s, { type: "addItems", day: today, meal: "lunch", items: parseMeal("1 porsiya osh, achchiq-chuchuk").items });
    s = reducer(s, { type: "addItems", day: today, meal: "breakfast", items: parseMeal("2 ta tuxum").items });
    const sum = summarize(s, today);
    expect(sum.byMeal.lunch.map((e) => e.foodId)).toEqual(["osh", "achchiq_chuchuk"]);
    expect(sum.byMeal.breakfast).toHaveLength(1);
    const expected = parseMeal("1 porsiya osh, achchiq-chuchuk, 2 ta tuxum").total.kcal;
    expect(Math.abs(sum.food.kcal - expected)).toBeLessThanOrEqual(1);
    expect(targetsOf(s)!.calories).toBe(1950);
  });

  it("removes entries, tracks water and never goes negative", () => {
    let s = reducer(EMPTY, { type: "addItems", day: today, meal: "snack", items: parseMeal("1 olma").items });
    s = reducer(s, { type: "removeEntry", id: s.entries[0]!.id });
    expect(s.entries).toHaveLength(0);
    s = reducer(s, { type: "water", day: today, deltaMl: 250 });
    s = reducer(s, { type: "water", day: today, deltaMl: -500 });
    expect(s.water[today]).toBe(0);
  });

  it("weight updates the profile only for the latest day", () => {
    let s = reducer(EMPTY, { type: "setProfile", profile });
    s = reducer(s, { type: "weight", day: shiftDay(today, -10), kg: 90 });
    expect(s.profile!.weightKg).toBe(85);
    s = reducer(s, { type: "weight", day: today, kg: 84 });
    expect(s.profile!.weightKg).toBe(84);
    expect(s.weights.map((w) => w.kg)).toEqual([90, 84]);
  });

  it("workouts add burned calories to the budget", () => {
    let s = reducer(EMPTY, { type: "setProfile", profile });
    s = reducer(s, { type: "workout", day: today, exerciseId: "run", minutes: 30 });
    expect(summarize(s, today).burned).toBe(353);
  });

  it("streak, frequent inputs, meal by hour and tips", () => {
    let s = EMPTY;
    for (const d of [0, -1, -2, -4]) s = reducer(s, { type: "addItems", day: shiftDay(today, d), meal: "lunch", items: parseMeal("1 ta somsa").items });
    expect(streak(s, today)).toBe(3);
    expect(frequentInputs(s)[0]).toBe("1 ta somsa");
    expect(mealForHour(8)).toBe("breakfast");
    expect(mealForHour(13)).toBe("lunch");
    expect(mealForHour(21)).toBe("dinner");
    s = reducer(s, { type: "setProfile", profile });
    s = reducer(s, { type: "addItems", day: today, meal: "dinner", items: parseMeal("1 lagan osh, 3 ta somsa").items });
    expect(tips(summarize(s, today), targetsOf(s), 20).length).toBeGreaterThan(0);
  });

  it("shiftDay crosses month boundaries", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("custom foods", () => {
  it("saves, replaces by name and removes user foods", () => {
    const food = createCustomFood({ name: "Agusha", per100: { kcal: 159, protein: 18, fat: 9, carbs: 2 } }, "u:a");
    let s = reducer(EMPTY, { type: "saveFood", food });
    s = reducer(s, { type: "saveFood", food: { ...food, id: "u:b" } });
    expect(s.customFoods.map((f) => f.id)).toEqual(["u:b"]);
    s = reducer(s, { type: "addItems", day: today, meal: "snack", items: parseMeal("200 g agusha", { extraFoods: s.customFoods }).items });
    expect(summarize(s, today).food.kcal).toBe(318);
    s = reducer(s, { type: "removeFood", id: "u:b" });
    expect(s.customFoods).toHaveLength(0);
  });

  it("maps an Open Food Facts product", () => {
    const f = offToFood("4600605000123", { product_name: "Kefir 1%", nutriments: { "energy-kcal_100g": 40, proteins_100g: 3, fat_100g: 1, carbohydrates_100g: 4 }, serving_quantity: 200 });
    expect(f).toMatchObject({ id: "off:4600605000123", per100: { kcal: 40, protein: 3, fat: 1, carbs: 4 }, portions: { dona: 200 } });
    expect(f!.ref).toContain("Open Food Facts");
    expect(offToFood("1", { product_name: "x", nutriments: {} })).toBeNull();
  });
});

describe("body measurements", () => {
  const profile = { sex: "male" as const, age: 30, heightCm: 178, weightKg: 85, activity: "light" as const, goal: "cut" as const };
  it("stores a measurement, updates weight and body fat used for targets", () => {
    let s = reducer(EMPTY, { type: "setProfile", profile });
    const before = targetsOf(s)!;
    s = reducer(s, { type: "measure", m: { day: dayKey(), neckCm: 39, waistCm: 92, weightKg: 84, bodyFatPct: 20.9 } });
    expect(s.measurements).toHaveLength(1);
    expect(s.profile!.bodyFatPct).toBe(20.9);
    expect(s.profile!.weightKg).toBe(84);
    expect(targetsOf(s)!.bmrFormula).toBe("katch");
    expect(before.bmrFormula).toBe("mifflin");
  });
  it("replaces the same day and keeps an older entry from overriding the profile", () => {
    let s = reducer(EMPTY, { type: "setProfile", profile });
    s = reducer(s, { type: "measure", m: { day: dayKey(), neckCm: 39, waistCm: 92, weightKg: 84, bodyFatPct: 20.9 } });
    s = reducer(s, { type: "measure", m: { day: dayKey(), neckCm: 39, waistCm: 91, weightKg: 84, bodyFatPct: 20.3 } });
    s = reducer(s, { type: "measure", m: { day: shiftDay(dayKey(), -14), neckCm: 39, waistCm: 96, weightKg: 88, bodyFatPct: 23 } });
    expect(s.measurements.map((m) => m.bodyFatPct)).toEqual([23, 20.3]);
    expect(s.profile!.bodyFatPct).toBe(20.3);
    s = reducer(s, { type: "removeMeasure", day: dayKey() });
    expect(s.measurements).toHaveLength(1);
  });
});
