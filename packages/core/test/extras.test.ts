import { describe, expect, it } from "vitest";
import {
  EXERCISE_LIBRARY, FASTING_PLANS, MENU_OPTIONS, achievements, adaptiveTdee, computeTargets, dayScore, fastingStatus, generateMenu,
  parseMeal, weightTrend,
} from "../src";

const H = 3600000;

describe("fasting", () => {
  it("tracks progress, stage and end time", () => {
    const start = Date.UTC(2026, 0, 1, 20);
    const s = fastingStatus(start, 16, start + 13 * H);
    expect(s.progress).toBeCloseTo(13 / 16, 2);
    expect(s.remainingMin).toBe(180);
    expect(s.stage.title).toBe("Yog' yoqish");
    expect(s.done).toBe(false);
    expect(new Date(s.endsAt).getUTCHours()).toBe(12);
    expect(fastingStatus(start, 16, start + 17 * H).done).toBe(true);
    expect(FASTING_PLANS.map((p) => p.fastHours)).toContain(16);
  });
});

describe("adaptive TDEE", () => {
  const days = (n: number) => Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));
  it("smooths daily noise", () => {
    const w = days(10).map((day, i) => ({ day, kg: 80 + (i % 2 ? 1 : -1) }));
    const t = weightTrend(w);
    expect(Math.max(...t.map((x) => x.kg)) - Math.min(...t.map((x) => x.kg))).toBeLessThan(1);
  });
  it("recovers real expenditure from intake and weight trend", () => {
    // Eats 2000 kcal, loses 0.5 kg/week → TDEE ≈ 2000 + 550 = 2550
    const d = days(35);
    const intake = d.map((day) => ({ day, kcal: 2000 }));
    const weights = d.map((day, i) => ({ day, kg: 85 - (0.5 / 7) * i }));
    const r = adaptiveTdee(intake, weights)!;
    expect(r.tdee).toBeGreaterThan(2400);
    expect(r.tdee).toBeLessThan(2700);
    expect(r.trendChangeKg).toBeLessThan(0);
    expect(r.confidence).toBe("high");
  });
  it("needs enough data", () => {
    const d = days(7);
    expect(adaptiveTdee(d.map((day) => ({ day, kcal: 2000 })), d.map((day) => ({ day, kg: 80 })))).toBeNull();
  });
});

describe("menu generator", () => {
  it("every option is understood by the parser", () => {
    for (const list of Object.values(MENU_OPTIONS)) for (const t of list) expect(parseMeal(t).unknown, t).toEqual([]);
  });
  it("hits calories within 5% and protein reasonably for each goal", () => {
    for (const goal of ["cut", "lose", "maintain", "gain"] as const) {
      const t = computeTargets({ sex: "male", age: 28, heightCm: 178, weightKg: 80, activity: "light", goal });
      for (const seed of [1, 7, 42]) {
        const m = generateMenu({ calories: t.calories, protein: t.protein, goal }, seed);
        expect(m.meals).toHaveLength(4);
        expect(Math.abs(m.total.kcal - t.calories) / t.calories).toBeLessThan(0.05);
        expect(m.total.protein).toBeGreaterThan(t.protein * 0.7);
      }
    }
  });
  it("is reproducible per seed and varies across seeds", () => {
    const a = generateMenu({ calories: 2000, protein: 120 }, 3);
    const b = generateMenu({ calories: 2000, protein: 120 }, 3);
    expect(a.meals.map((m) => m.text)).toEqual(b.meals.map((m) => m.text));
    const texts = new Set([1, 2, 3, 4, 5, 6].map((s) => generateMenu({ calories: 2000, protein: 120 }, s).meals.map((m) => m.text).join("|")));
    expect(texts.size).toBeGreaterThan(1);
  });
});

describe("achievements and day score", () => {
  it("marks earned badges", () => {
    const a = achievements({
      streak: 4, bestStreak: 8, daysLogged: 10, entries: 60, waterGoalDays: 2, proteinGoalDays: 7, calorieGoalDays: 1,
      measurements: 0, weighIns: 3, weightChangeKg: -2.4, fastsCompleted: 0, workouts: 0, customFoods: 0,
    });
    const earned = a.filter((x) => x.earned).map((x) => x.id);
    expect(earned).toEqual(expect.arrayContaining(["first", "streak3", "streak7", "logger50", "protein7", "lost2"]));
    expect(earned).not.toContain("streak30");
    expect(a.find((x) => x.id === "water7")!.progress).toBeCloseTo(2 / 7);
  });
  it("scores a balanced day higher than a junk day", () => {
    const t = computeTargets({ sex: "male", age: 30, heightCm: 178, weightKg: 80, activity: "light", goal: "lose" });
    const good = dayScore({ kcal: t.calories, protein: t.protein, fat: t.fat, carbs: t.carbs }, t, { waterMl: t.waterMl, plantsKcal: 300 });
    const bad = dayScore({ kcal: t.calories * 1.5, protein: 40, fat: t.fat * 2, carbs: 400 }, t, { waterMl: 500, sweetsKcal: 900 });
    expect(good.grade).toBe("A");
    expect(bad.score).toBeLessThan(40);
    expect(bad.improve.length).toBeGreaterThan(2);
  });
});

describe("exercise library", () => {
  it("has technique and mistakes for every exercise", () => {
    expect(EXERCISE_LIBRARY.length).toBeGreaterThanOrEqual(12);
    for (const e of EXERCISE_LIBRARY) {
      expect(e.steps.length).toBeGreaterThan(1);
      expect(e.mistakes.length).toBeGreaterThan(0);
    }
  });
});
