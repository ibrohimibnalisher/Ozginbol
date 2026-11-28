/** Badges that reward habits, not just weight. Computed from stats, never stored. */

export interface HabitStats {
  streak: number;
  bestStreak: number;
  daysLogged: number;
  entries: number;
  waterGoalDays: number;
  proteinGoalDays: number;
  calorieGoalDays: number;
  measurements: number;
  weighIns: number;
  weightChangeKg: number; // negative = lost
  fastsCompleted: number;
  workouts: number;
  customFoods: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  text: string;
  /** 0..1 */
  progress: number;
  earned: boolean;
}

type Def = { id: string; icon: string; title: string; text: string; value: (s: HabitStats) => number; goal: number };

const DEFS: Def[] = [
  { id: "first", icon: "🍽", title: "Birinchi qadam", text: "Birinchi ovqatni yozing", value: (s) => s.entries, goal: 1 },
  { id: "streak3", icon: "🔥", title: "3 kun ketma-ket", text: "3 kun uzluksiz yozing", value: (s) => s.bestStreak, goal: 3 },
  { id: "streak7", icon: "🔥", title: "Bir hafta", text: "7 kun uzluksiz yozing", value: (s) => s.bestStreak, goal: 7 },
  { id: "streak30", icon: "🏆", title: "Bir oy", text: "30 kun uzluksiz yozing", value: (s) => s.bestStreak, goal: 30 },
  { id: "logger50", icon: "📒", title: "50 ta yozuv", text: "Kundalikka 50 ta taom yozing", value: (s) => s.entries, goal: 50 },
  { id: "water7", icon: "💧", title: "Suvchi", text: "7 kun suv me'yorini bajaring", value: (s) => s.waterGoalDays, goal: 7 },
  { id: "protein7", icon: "🥩", title: "Oqsil ustasi", text: "7 kun oqsil me'yorini bajaring", value: (s) => s.proteinGoalDays, goal: 7 },
  { id: "ontarget7", icon: "🎯", title: "Aniq nishon", text: "7 kun kaloriya me'yorida qoling (±10%)", value: (s) => s.calorieGoalDays, goal: 7 },
  { id: "measure", icon: "📏", title: "O'lchovchi", text: "3 marta tana o'lchamini yozing", value: (s) => s.measurements, goal: 3 },
  { id: "weigh10", icon: "⚖️", title: "Tarozi do'sti", text: "10 marta vazn yozing", value: (s) => s.weighIns, goal: 10 },
  { id: "lost2", icon: "📉", title: "Minus 2 kg", text: "2 kg yo'qoting", value: (s) => -s.weightChangeKg, goal: 2 },
  { id: "lost5", icon: "🥇", title: "Minus 5 kg", text: "5 kg yo'qoting", value: (s) => -s.weightChangeKg, goal: 5 },
  { id: "fast5", icon: "⏳", title: "Ochlik yo'li", text: "5 ta ochlikni oxiriga yetkazing", value: (s) => s.fastsCompleted, goal: 5 },
  { id: "workout10", icon: "🏃", title: "Harakatda", text: "10 ta mashg'ulot yozing", value: (s) => s.workouts, goal: 10 },
  { id: "chef", icon: "👨‍🍳", title: "Oshpaz", text: "O'z retsept yoki mahsulotingizni qo'shing", value: (s) => s.customFoods, goal: 1 },
];

export function achievements(s: HabitStats): Achievement[] {
  return DEFS.map((d) => {
    const v = Math.max(0, d.value(s));
    return { id: d.id, icon: d.icon, title: d.title, text: d.text, progress: Math.min(1, v / d.goal), earned: v >= d.goal };
  });
}
