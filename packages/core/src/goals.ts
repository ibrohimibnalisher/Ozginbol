export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
/** cut = sushka (fat loss while keeping muscle), gain = massa nabor. */
export type Goal = "cut" | "lose" | "maintain" | "gain";

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  /** Desired weight change per week, kg (always positive). Defaults per goal. */
  rateKgPerWeek?: number;
  targetWeightKg?: number;
  /** Optional body fat %. When given, BMR uses Katch-McArdle (more accurate for athletes). */
  bodyFatPct?: number;
}

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2, // office, < 5k steps
  light: 1.375, // 1-3 workouts / week
  moderate: 1.55, // 3-5 workouts / week
  active: 1.725, // 6-7 workouts / week
  very_active: 1.9, // physical job + training
};

export const GOAL_INFO: Record<Goal, { label: string; defaultRate: number; rates: number[] }> = {
  cut: { label: "Sushka (quritish)", defaultRate: 0.5, rates: [0.25, 0.5, 0.75, 1] },
  lose: { label: "Ozish", defaultRate: 0.5, rates: [0.25, 0.5, 0.75, 1] },
  maintain: { label: "Vaznni saqlash", defaultRate: 0, rates: [0] },
  gain: { label: "Massa nabor", defaultRate: 0.25, rates: [0.1, 0.25, 0.5] },
};

/** Macro rules per goal, in grams per kg of reference body weight. */
const MACRO_RULES: Record<Goal, { proteinPerKg: number; fatPerKg: number; minFatPct: number }> = {
  cut: { proteinPerKg: 2.2, fatPerKg: 0.8, minFatPct: 0.2 }, // high protein keeps muscle in a deficit
  lose: { proteinPerKg: 1.8, fatPerKg: 0.9, minFatPct: 0.25 },
  maintain: { proteinPerKg: 1.6, fatPerKg: 1.0, minFatPct: 0.25 },
  gain: { proteinPerKg: 1.8, fatPerKg: 1.0, minFatPct: 0.25 },
};

const KCAL_PER_KG = 7700; // energy in 1 kg of body fat tissue

export interface Targets {
  bmr: number;
  bmrFormula: "mifflin" | "katch";
  tdee: number;
  calories: number;
  /** calories − tdee: negative is a deficit. */
  dailyDelta: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  waterMl: number;
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obese";
  /** Expected weight change per week in kg at this calorie level (negative = loss). */
  weeklyChangeKg: number;
  weeksToTarget: number | null;
  /** Healthy BMI 18.5-24.9 range for this height. */
  healthyWeight: [number, number];
  /** Human-readable calculation, step by step. */
  steps: string[];
  warnings: string[];
}

/** Mifflin-St Jeor resting energy expenditure (kcal/day). */
export function bmr(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

/** Katch-McArdle, uses lean body mass. */
export function bmrKatch(weightKg: number, bodyFatPct: number): number {
  const lbm = weightKg * (1 - bodyFatPct / 100);
  return Math.round(370 + 21.6 * lbm);
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

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Daily calories and macros for a goal.
 * 1. BMR: Mifflin-St Jeor (or Katch-McArdle if body fat % is known).
 * 2. TDEE = BMR × activity factor.
 * 3. Goal: deficit/surplus = rate (kg/week) × 7700 / 7, capped for safety
 *    (deficit ≤ 25% TDEE, sushka ≤ 30%, surplus ≤ 20%; never below 1200/1500 kcal).
 * 4. Protein and fat in g/kg by goal (sushka 2.2 g/kg protein), carbs take the rest.
 */
export function computeTargets(p: Profile): Targets {
  const steps: string[] = [];
  const warnings: string[] = [];
  const useKatch = p.bodyFatPct !== undefined && p.bodyFatPct > 3 && p.bodyFatPct < 60;
  const b = useKatch ? bmrKatch(p.weightKg, p.bodyFatPct!) : bmr(p);
  if (useKatch) {
    const lbm = Math.round(p.weightKg * (1 - p.bodyFatPct! / 100) * 10) / 10;
    steps.push(`BMR (Katch-McArdle): 370 + 21.6 × ${lbm} kg yog'siz massa = ${b} kkal`);
  } else {
    steps.push(
      `BMR (Mifflin-St Jeor): 10 × ${p.weightKg} + 6.25 × ${p.heightCm} − 5 × ${p.age} ${p.sex === "male" ? "+ 5" : "− 161"} = ${b} kkal`,
    );
  }
  const factor = ACTIVITY_FACTOR[p.activity];
  const tdee = Math.round(b * factor);
  steps.push(`Sarf (TDEE): ${b} × ${factor} (faollik) = ${tdee} kkal`);

  const info = GOAL_INFO[p.goal];
  const wantedRate = p.goal === "maintain" ? 0 : Math.max(0, p.rateKgPerWeek ?? info.defaultRate);
  let delta = 0;
  if (p.goal === "cut" || p.goal === "lose") {
    const wanted = (wantedRate * KCAL_PER_KG) / 7;
    const cap = tdee * (p.goal === "cut" ? 0.3 : 0.25);
    const floor = p.sex === "male" ? 1500 : 1200;
    delta = -Math.min(wanted, cap, Math.max(0, tdee - floor));
    if (-delta < 1) warnings.push("Hozirgi faollikda sarfingiz xavfsiz minimumga teng. Ozish uchun faollikni oshiring (kuniga 8-10 ming qadam).");
    else if (wanted > -delta + 1) warnings.push(`Haftasiga ${wantedRate} kg xavfsiz emas: defitsit ${Math.round(-delta)} kkal bilan cheklandi.`);
    if (wantedRate > p.weightKg * 0.01) warnings.push("Haftasiga vaznning 1% dan ko'p tashlash mushak yo'qotishga olib keladi.");
  } else if (p.goal === "gain") {
    const wanted = (wantedRate * KCAL_PER_KG) / 7;
    const cap = tdee * 0.2;
    delta = Math.min(wanted, cap);
    if (wanted > cap + 1) warnings.push(`Haftasiga ${wantedRate} kg tez: ortiqcha ${Math.round(delta)} kkal bilan cheklandi, aks holda yog' yig'iladi.`);
  }
  const calories = round10(tdee + delta);
  const dailyDelta = calories - tdee;
  if (p.goal !== "maintain") {
    steps.push(
      `${info.label}: haftasiga ${wantedRate} kg → kuniga ${dailyDelta > 0 ? "+" : ""}${dailyDelta} kkal (1 kg yog' ≈ 7700 kkal) → ${calories} kkal`,
    );
  } else {
    steps.push(`Vaznni saqlash: ${calories} kkal`);
  }

  const bmiV = bmi(p.heightCm, p.weightKg);
  const h = p.heightCm / 100;
  // For BMI > 30, base protein on an adjusted weight so targets stay realistic.
  const refWeight = bmiV > 30 ? 25 * h * h + 0.25 * (p.weightKg - 25 * h * h) : p.weightKg;
  const rule = MACRO_RULES[p.goal];
  const protein = Math.round(refWeight * rule.proteinPerKg);
  let fat = Math.round(Math.max(refWeight * rule.fatPerKg, (calories * rule.minFatPct) / 9));
  let carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  if (carbs < 50) {
    // Very low budgets: keep at least 50 g carbs, trim fat down to 0.6 g/kg.
    fat = Math.max(Math.round(refWeight * 0.6), Math.round((calories - protein * 4 - 50 * 4) / 9));
    carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  }
  steps.push(
    `Oqsil ${rule.proteinPerKg} g/kg × ${Math.round(refWeight)} kg = ${protein} g · Yog' ${fat} g · Uglevod qolgani = ${carbs} g`,
  );

  const weeklyChangeKg = Math.round(((dailyDelta * 7) / KCAL_PER_KG) * 100) / 100;
  let weeksToTarget: number | null = null;
  if (p.targetWeightKg && weeklyChangeKg !== 0) {
    const diff = p.targetWeightKg - p.weightKg;
    if (Math.sign(diff) === Math.sign(weeklyChangeKg)) weeksToTarget = Math.ceil(Math.abs(diff / weeklyChangeKg));
    else warnings.push("Maqsad vazn tanlangan rejimga to'g'ri kelmaydi.");
  }
  const healthyWeight: [number, number] = [Math.round(18.5 * h * h), Math.round(24.9 * h * h)];
  if (p.goal === "cut" && bmiV > 27) warnings.push("Sushka odatda yog' foizi past odamlar uchun. Sizga oddiy 'Ozish' rejimi mos.");
  if ((p.goal === "cut" || p.goal === "lose") && bmiV < 18.5) warnings.push("Vazningiz allaqachon me'yordan past. Ozish tavsiya etilmaydi.");

  return {
    bmr: b,
    bmrFormula: useKatch ? "katch" : "mifflin",
    tdee,
    calories,
    dailyDelta,
    protein,
    fat,
    carbs,
    fiber: Math.round((calories / 1000) * 14),
    waterMl: Math.round((p.weightKg * 33) / 50) * 50,
    bmi: bmiV,
    bmiCategory: bmiCategory(bmiV),
    weeklyChangeKg,
    weeksToTarget,
    healthyWeight,
    steps,
    warnings,
  };
}
