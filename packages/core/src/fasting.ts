/** Intermittent fasting: plans, live status and what the body is doing. */

export interface FastingPlan {
  id: string;
  label: string;
  fastHours: number;
  hint: string;
}

export const FASTING_PLANS: FastingPlan[] = [
  { id: "12:12", label: "12:12", fastHours: 12, hint: "Boshlovchilar uchun: kechki ovqatdan nonushtagacha" },
  { id: "14:10", label: "14:10", fastHours: 14, hint: "Yengil: kechki 20:00 dan ertalab 10:00 gacha" },
  { id: "16:8", label: "16:8", fastHours: 16, hint: "Eng mashhur: 8 soat ichida ovqatlanish" },
  { id: "18:6", label: "18:6", fastHours: 18, hint: "Tajribalilar uchun: 6 soatlik ovqat oynasi" },
  { id: "20:4", label: "20:4", fastHours: 20, hint: "Qattiq: 4 soatlik ovqat oynasi" },
];

export interface FastingStage {
  fromHours: number;
  title: string;
  text: string;
}

// Rough, population-level timeline. Individual timing varies with the last meal and activity.
export const FASTING_STAGES: FastingStage[] = [
  { fromHours: 0, title: "Hazm qilish", text: "Oxirgi ovqat hazm bo'lmoqda, qonda qand va insulin yuqori." },
  { fromHours: 4, title: "Qand pasaymoqda", text: "Insulin tushadi, tana jigardagi glikogen zaxirasidan foydalanadi." },
  { fromHours: 12, title: "Yog' yoqish", text: "Glikogen kamayib, yog' ko'proq yoqila boshlaydi." },
  { fromHours: 16, title: "Faol yog' yoqish", text: "Yog' asosiy yoqilg'iga aylanadi, keton tanachalar ko'payadi." },
  { fromHours: 24, title: "Uzoq ochlik", text: "24 soatdan uzoq ochlikni shifokor bilan kelishing." },
];

export interface FastingStatus {
  elapsedMin: number;
  remainingMin: number;
  /** 0..1 of the planned fast. */
  progress: number;
  done: boolean;
  stage: FastingStage;
  /** Clock time (ms) when the fast reaches its goal. */
  endsAt: number;
}

export function fastingStatus(startedAt: number, fastHours: number, now = Date.now()): FastingStatus {
  const elapsedMin = Math.max(0, Math.floor((now - startedAt) / 60000));
  const goalMin = fastHours * 60;
  const h = elapsedMin / 60;
  const stage = [...FASTING_STAGES].reverse().find((s) => h >= s.fromHours)!;
  return {
    elapsedMin,
    remainingMin: Math.max(0, goalMin - elapsedMin),
    progress: Math.min(1, elapsedMin / goalMin),
    done: elapsedMin >= goalMin,
    stage,
    endsAt: startedAt + goalMin * 60000,
  };
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} soat ${m} daq` : `${m} daq`;
}

export const FASTING_WARNING =
  "Homiladorlik, emizish, 1-tur diabet, ovqatlanish buzilishi yoki dori ichayotgan bo'lsangiz, ochlikni shifokor bilan kelishing.";
