import { describe, expect, it } from "vitest";
import { parseMeal } from "@ozginbol/core";
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
    expect(sum.food.kcal).toBe(683 + 48 + 171);
    expect(targetsOf(s)!.calories).toBe(2000);
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
