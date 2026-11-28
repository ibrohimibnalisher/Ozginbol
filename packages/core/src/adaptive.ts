/**
 * Adaptive energy expenditure (the MacroFactor idea): the scale and the food log
 * together reveal how much you really burn, which formulas can only guess.
 */

export interface DayIntake {
  day: string; // YYYY-MM-DD
  kcal: number;
}
export interface WeighIn {
  day: string;
  kg: number;
}

const DAY = 86400000;
const toT = (d: string) => Date.parse(`${d}T00:00:00Z`);

/**
 * Exponentially smoothed weight trend, one value per calendar day from the first weigh-in.
 * Daily water swings (±1 kg) are mostly filtered out. alpha 0.1 ≈ 10-day memory.
 */
export function weightTrend(weights: WeighIn[], alpha = 0.1): WeighIn[] {
  const w = [...weights].sort((a, b) => a.day.localeCompare(b.day));
  if (!w.length) return [];
  const byDay = new Map(w.map((x) => [x.day, x.kg]));
  const out: WeighIn[] = [];
  let trend = w[0]!.kg;
  for (let t = toT(w[0]!.day); t <= toT(w[w.length - 1]!.day); t += DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    const kg = byDay.get(day);
    if (kg !== undefined) trend = trend + alpha * (kg - trend);
    out.push({ day, kg: Math.round(trend * 100) / 100 });
  }
  return out;
}

export interface AdaptiveResult {
  /** Estimated real daily expenditure, kcal. */
  tdee: number;
  avgIntake: number;
  /** Trend weight change over the window, kg (negative = loss). */
  trendChangeKg: number;
  days: number;
  loggedDays: number;
  confidence: "low" | "medium" | "high";
}

/**
 * TDEE = average intake − (trend change × 7700 kcal/kg ÷ days).
 * Needs at least 10 logged days and weigh-ins spanning 14+ days in the window.
 */
export function adaptiveTdee(intake: DayIntake[], weights: WeighIn[], windowDays = 28, today?: string): AdaptiveResult | null {
  const end = today ?? [...intake.map((i) => i.day), ...weights.map((w) => w.day)].sort().pop();
  if (!end) return null;
  const start = new Date(toT(end) - (windowDays - 1) * DAY).toISOString().slice(0, 10);
  const logged = intake.filter((i) => i.day >= start && i.day <= end && i.kcal > 300);
  const ws = weights.filter((w) => w.day >= start && w.day <= end).sort((a, b) => a.day.localeCompare(b.day));
  if (logged.length < 10 || ws.length < 2) return null;
  const span = (toT(ws[ws.length - 1]!.day) - toT(ws[0]!.day)) / DAY;
  if (span < 14) return null;
  // Seed the trend with earlier weigh-ins so the window start is already smoothed.
  const trend = weightTrend(weights.filter((w) => w.day <= end));
  const at = (d: string) => trend.find((x) => x.day >= d)?.kg ?? trend[trend.length - 1]!.kg;
  const change = at(ws[ws.length - 1]!.day) - at(ws[0]!.day);
  const avgIntake = logged.reduce((a, i) => a + i.kcal, 0) / logged.length;
  const tdee = Math.round(avgIntake - (change * 7700) / span);
  const coverage = logged.length / windowDays;
  return {
    tdee,
    avgIntake: Math.round(avgIntake),
    trendChangeKg: Math.round(change * 10) / 10,
    days: Math.round(span),
    loggedDays: logged.length,
    confidence: coverage >= 0.8 && ws.length >= 8 ? "high" : coverage >= 0.5 ? "medium" : "low",
  };
}
