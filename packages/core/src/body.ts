import type { Sex } from "./goals";

/** Tape measurements in cm. Hip is required for women only. */
export interface Measurements {
  sex: Sex;
  age?: number;
  heightCm: number;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
}

export type FatCategory = "essential" | "athlete" | "fitness" | "average" | "obese";
export type Risk = "low" | "increased" | "high";

export interface BodyComposition {
  /** US Navy body fat %, one decimal. */
  bodyFatPct: number;
  category: FatCategory;
  fatMassKg: number;
  leanMassKg: number;
  /** Waist-to-height ratio, two decimals. Above 0.5 means more belly fat than healthy. */
  waistToHeight: number;
  whtrRisk: Risk;
  /** WHO waist circumference risk. */
  waistRisk: Risk;
  /** Waist-to-hip ratio when hip is given. */
  waistToHip?: number;
  /** BMI-based estimate (Deurenberg) for comparison, when age is known. */
  bmiEstimatePct?: number;
  /** Range of a healthy body fat % for this sex. */
  healthyRange: [number, number];
  steps: string[];
}

/** American Council on Exercise ranges: [upper bound of each category]. */
export const FAT_CATEGORY_BOUNDS: Record<Sex, [FatCategory, number][]> = {
  male: [
    ["essential", 6],
    ["athlete", 14],
    ["fitness", 18],
    ["average", 25],
    ["obese", Infinity],
  ],
  female: [
    ["essential", 14],
    ["athlete", 21],
    ["fitness", 25],
    ["average", 32],
    ["obese", Infinity],
  ],
};

export const FAT_CATEGORY_LABELS: Record<FatCategory, string> = {
  essential: "juda past (zarur yog')",
  athlete: "sportchi",
  fitness: "fitnes, yaxshi",
  average: "o'rtacha",
  obese: "ortiqcha yog'",
};

export const RISK_LABELS: Record<Risk, string> = { low: "past", increased: "oshgan", high: "yuqori" };

export const MEASURE_TIPS: { key: "neck" | "waist" | "hip"; label: string; tip: string }[] = [
  { key: "neck", label: "Bo'yin", tip: "Kekirdakdan pastroqda, lenta biroz pastga qiyalab." },
  { key: "waist", label: "Bel", tip: "Erkaklar kindik ustidan, ayollar belning eng ingichka joyidan. Nafas chiqargandan keyin, qorinni ichga tortmang." },
  { key: "hip", label: "Son (bo'ksa)", tip: "Faqat ayollar: dumbaning eng keng joyidan." },
];

const r1 = (x: number) => Math.round(x * 10) / 10;

/** Validates tape measurements; returns an Uzbek error message or null. */
export function measurementError(m: Measurements): string | null {
  if (!(m.heightCm >= 120 && m.heightCm <= 230)) return "Bo'yni 120-230 sm oralig'ida kiriting";
  if (!(m.neckCm >= 20 && m.neckCm <= 70)) return "Bo'yin aylanasini 20-70 sm oralig'ida kiriting";
  if (!(m.waistCm >= 40 && m.waistCm <= 200)) return "Bel aylanasini 40-200 sm oralig'ida kiriting";
  if (m.sex === "female" && !(m.hipCm && m.hipCm >= 50 && m.hipCm <= 200)) return "Ayollar uchun son aylanasi ham kerak (50-200 sm)";
  const span = m.sex === "male" ? m.waistCm - m.neckCm : m.waistCm + (m.hipCm ?? 0) - m.neckCm;
  if (span <= 5) return "Bel aylanasi bo'yin aylanasidan ancha katta bo'lishi kerak. O'lchamlarni tekshiring";
  const raw = rawNavy(m);
  if (!(raw >= 3 && raw <= 60)) return "O'lchamlar bir-biriga mos kelmayapti (natija mumkin bo'lmagan yog' foizi). Lentani qayta o'lchang";
  return null;
}

/** US Navy circumference method (Hodgdon & Beckett, 1984), metric form. */
function rawNavy(m: Measurements): number {
  const { log10 } = Math;
  return m.sex === "male"
      ? 495 / (1.0324 - 0.19077 * log10(m.waistCm - m.neckCm) + 0.15456 * log10(m.heightCm)) - 450
      : 495 / (1.29579 - 0.35004 * log10(m.waistCm + (m.hipCm ?? 0) - m.neckCm) + 0.221 * log10(m.heightCm)) - 450;
}

export function navyBodyFat(m: Measurements): number {
  return r1(Math.min(60, Math.max(3, rawNavy(m))));
}

export function fatCategory(sex: Sex, pct: number): FatCategory {
  return FAT_CATEGORY_BOUNDS[sex].find(([, max]) => pct < max)![0];
}

export function bodyComposition(m: Measurements): BodyComposition {
  const err = measurementError(m);
  if (err) throw new Error(err);
  const pct = navyBodyFat(m);
  const fat = r1((m.weightKg * pct) / 100);
  const whtr = Math.round((m.waistCm / m.heightCm) * 100) / 100;
  const [inc, high] = m.sex === "male" ? [94, 102] : [80, 88];
  const bmi = m.weightKg / (m.heightCm / 100) ** 2;
  const bmiEst = m.age ? r1(1.2 * bmi + 0.23 * m.age - 10.8 * (m.sex === "male" ? 1 : 0) - 5.4) : undefined;
  const healthyRange: [number, number] = m.sex === "male" ? [10, 20] : [18, 28];

  const steps =
    m.sex === "male"
      ? [
          `Bel − bo'yin = ${m.waistCm} − ${m.neckCm} = ${r1(m.waistCm - m.neckCm)} sm`,
          `Yog' % = 495 ÷ (1.0324 − 0.19077 × log(${r1(m.waistCm - m.neckCm)}) + 0.15456 × log(${m.heightCm})) − 450 = ${pct}%`,
        ]
      : [
          `Bel + son − bo'yin = ${m.waistCm} + ${m.hipCm} − ${m.neckCm} = ${r1(m.waistCm + (m.hipCm ?? 0) - m.neckCm)} sm`,
          `Yog' % = 495 ÷ (1.29579 − 0.35004 × log(${r1(m.waistCm + (m.hipCm ?? 0) - m.neckCm)}) + 0.221 × log(${m.heightCm})) − 450 = ${pct}%`,
        ];
  steps.push(`Yog' massasi: ${m.weightKg} kg × ${pct}% = ${fat} kg, yog'siz massa ${r1(m.weightKg - fat)} kg`);
  steps.push(`Bel ÷ bo'y = ${m.waistCm} ÷ ${m.heightCm} = ${whtr.toFixed(2)} (0.5 dan past bo'lishi kerak)`);

  return {
    bodyFatPct: pct,
    category: fatCategory(m.sex, pct),
    fatMassKg: fat,
    leanMassKg: r1(m.weightKg - fat),
    waistToHeight: whtr,
    whtrRisk: whtr < 0.5 ? "low" : whtr < 0.6 ? "increased" : "high",
    waistRisk: m.waistCm < inc ? "low" : m.waistCm < high ? "increased" : "high",
    waistToHip: m.hipCm ? Math.round((m.waistCm / m.hipCm) * 100) / 100 : undefined,
    bmiEstimatePct: bmiEst,
    healthyRange,
    steps,
  };
}

/** Parses "bo'yin 38 bel 85 son 98" (any order, Uzbek/Russian/English words, or bare "38 85 98"). */
export function parseMeasurements(text: string): { neckCm?: number; waistCm?: number; hipCm?: number; weightKg?: number } {
  const s = text.toLowerCase().replace(/[ʻʼ‘’`']/g, "").replace(",", ".");
  const out: { neckCm?: number; waistCm?: number; hipCm?: number; weightKg?: number } = {};
  const grab = (re: RegExp) => {
    const m = s.match(re);
    return m?.[1] ? parseFloat(m[1]) : undefined;
  };
  out.neckCm = grab(/(?:boyin|бўйин|шея|шеи|neck)\D{0,6}(\d+(?:\.\d+)?)/);
  out.waistCm = grab(/(?:bel|бел|талия|талии|waist)\D{0,6}(\d+(?:\.\d+)?)/);
  out.hipCm = grab(/(?:son|boksa|сон|бўкса|бёдра|бедра|таз|hips?)\D{0,6}(\d+(?:\.\d+)?)/);
  out.weightKg = grab(/(?:vazn|вазн|вес|weight)\D{0,6}(\d+(?:\.\d+)?)/);
  if (out.neckCm === undefined && out.waistCm === undefined) {
    const nums = (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (nums.length >= 2) {
      out.neckCm = nums[0];
      out.waistCm = nums[1];
      if (nums.length >= 3) out.hipCm = nums[2];
    }
  }
  for (const k of Object.keys(out) as (keyof typeof out)[]) if (out[k] === undefined) delete out[k];
  return out;
}
