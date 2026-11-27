export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2, // office, almost no exercise
  light: 1.375, // 1-3 workouts / week
  moderate: 1.55, // 3-5 workouts / week
  active: 1.725, // 6-7 workouts / week
  very_active: 1.9, // physical job + training
};

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  waterMl: number;
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obese";
  /** Expected weight change per week in kg at this calorie level (negative = loss). */
  weeklyChangeKg: number;
}

/** Mifflin-St Jeor resting energy expenditure (kcal/day). */
export function bmr(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(v: number): Targets["bmiCategory"] {
  if (v < 18.5) return "underweight";
  if (v < 25) return "normal";
  if (v < 30) return "overweight";
  return "obese";
}

/**
 * Daily calorie and macro targets.
 * - Loss: 20% deficit (about 0.5 kg/week for most people), never below 1200/1500 kcal.
 * - Gain: 10% surplus (lean gain).
 * - Protein: 1.6-2.0 g/kg, computed on an adjusted weight when BMI > 30.
 * - Fat: 27% of calories, at least 0.6 g/kg. Carbs: the rest.
 */
export function computeTargets(p: Profile): Targets {
  const b = bmr(p);
  const tdee = Math.round(b * ACTIVITY_FACTOR[p.activity]);
  const floor = p.sex === "male" ? 1500 : 1200;

  let calories = tdee;
  if (p.goal === "lose") calories = Math.max(floor, Math.round(tdee * 0.8));
  if (p.goal === "gain") calories = Math.round(tdee * 1.1);
  calories = Math.round(calories / 10) * 10;

  const bmiV = bmi(p.heightCm, p.weightKg);
  const h = p.heightCm / 100;
  const refWeight = bmiV > 30 ? 25 * h * h + 0.25 * (p.weightKg - 25 * h * h) : p.weightKg;
  const proteinPerKg = p.goal === "maintain" ? 1.6 : p.goal === "lose" ? 2.0 : 1.8;
  const protein = Math.round(refWeight * proteinPerKg);
  const fat = Math.round(Math.max((calories * 0.27) / 9, refWeight * 0.6));
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return {
    bmr: b,
    tdee,
    calories,
    protein,
    fat,
    carbs,
    fiber: Math.round((calories / 1000) * 14),
    waterMl: Math.round((p.weightKg * 33) / 50) * 50,
    bmi: bmiV,
    bmiCategory: bmiCategory(bmiV),
    weeklyChangeKg: Math.round((((calories - tdee) * 7) / 7700) * 100) / 100,
  };
}
