import type { Goal } from "./goals";

export interface TrainingDay {
  day: string;
  focus: string;
  exercises: string[];
}

export interface TrainingPlan {
  goal: Goal;
  title: string;
  summary: string;
  week: TrainingDay[];
  rules: string[];
}

const FULL_BODY_A = [
  "O'tirib-turish (squat): 3 × 12",
  "Yerdan ko'tarilish (otjimaniye), kerak bo'lsa tizzada: 3 × 8-12",
  "Hamla (vypad), har oyoqqa: 3 × 10",
  "Gantel yoki suv shishasi bilan eshkak tortish: 3 × 12",
  "Planka: 3 × 30-45 soniya",
];
const FULL_BODY_B = [
  "Rumin tortishi (gantel bilan): 3 × 10",
  "Stul ustiga chiqish (step-up): 3 × 10",
  "Yelkadan yuqoriga itarish (gantel): 3 × 10",
  "Glute bridge (dumba ko'prigi): 3 × 15",
  "Yon planka: har tomonga 3 × 20-30 soniya",
];
const GYM_PUSH = ["Shtanga bilan jim (bench press): 4 × 6-10", "Yelka jimi: 3 × 8-10", "Brus (dips): 3 × 8-12", "Triceps blokda: 3 × 12"];
const GYM_PULL = ["Turnik yoki yuqori blok: 4 × 6-10", "Shtanga eshkak: 3 × 8-10", "Yuz tortish (face pull): 3 × 15", "Biceps: 3 × 10-12"];
const GYM_LEGS = ["O'tirib-turish shtanga bilan: 4 × 6-8", "Rumin tortishi: 3 × 8-10", "Oyoq pressi: 3 × 10-12", "Boldir: 4 × 15"];

const PLANS: Record<Goal, TrainingPlan> = {
  lose: {
    goal: "lose",
    title: "Ozish uchun reja (uyda yoki zalda, haftasiga 4 kun)",
    summary: "Kuch mashqlari mushakni saqlaydi, yurish esa kaloriyani yoqadi. Asosiy natija baribir ovqatlanishdan keladi.",
    week: [
      { day: "Dushanba", focus: "Butun tana A", exercises: FULL_BODY_A },
      { day: "Seshanba", focus: "Kardio", exercises: ["30-40 daqiqa tez yurish yoki velosiped"] },
      { day: "Payshanba", focus: "Butun tana B", exercises: FULL_BODY_B },
      { day: "Shanba", focus: "Intervalli kardio", exercises: ["5 daqiqa qizish", "8 × (30 soniya tez / 90 soniya sekin)", "5 daqiqa sekin yurish"] },
    ],
    rules: [
      "Har kuni 8-10 ming qadam: bu eng oson va samarali yoqish usuli.",
      "Har hafta og'irlik yoki takrorlarni ozgina oshiring.",
      "Oqsilni har ovqatda yeng: tuxum, go'sht, tvorog, qatiq, dukkaklilar.",
      "7-9 soat uxlang: kam uyqu ishtahani oshiradi.",
      "Haftasiga 0.5-1% vazn tashlash me'yor, tezrog'i mushakni yo'qotadi.",
    ],
  },
  maintain: {
    goal: "maintain",
    title: "Sog'lom forma uchun reja (haftasiga 3-4 kun)",
    summary: "Kuch, chidamlilik va harakatchanlikni muvozanatda saqlaydi.",
    week: [
      { day: "Dushanba", focus: "Butun tana A", exercises: FULL_BODY_A },
      { day: "Chorshanba", focus: "Kardio", exercises: ["30 daqiqa yugurish, suzish yoki velosiped"] },
      { day: "Juma", focus: "Butun tana B", exercises: FULL_BODY_B },
      { day: "Yakshanba", focus: "Faol dam olish", exercises: ["45-60 daqiqa sayr, futbol yoki yoga"] },
    ],
    rules: [
      "Haftasiga kamida 150 daqiqa o'rtacha faollik (JSST tavsiyasi).",
      "Haftasiga 2 marta kuch mashqi.",
      "Uzoq o'tirganda har soatda 3-5 daqiqa yuring.",
    ],
  },
  gain: {
    goal: "gain",
    title: "Massa yig'ish uchun reja (zal, haftasiga 4-5 kun)",
    summary: "Mushak og'irlikni asta-sekin oshirish va kaloriya ortiqchaligi bilan o'sadi.",
    week: [
      { day: "Dushanba", focus: "Itarish (ko'krak, yelka, triceps)", exercises: GYM_PUSH },
      { day: "Seshanba", focus: "Tortish (orqa, biceps)", exercises: GYM_PULL },
      { day: "Payshanba", focus: "Oyoqlar", exercises: GYM_LEGS },
      { day: "Juma", focus: "Itarish + tortish (yengil)", exercises: [...GYM_PUSH.slice(0, 2), ...GYM_PULL.slice(0, 2)] },
      { day: "Shanba", focus: "Oyoqlar + qorin", exercises: [...GYM_LEGS.slice(0, 3), "Osilib oyoq ko'tarish: 3 × 12"] },
    ],
    rules: [
      "Har mashqda oxirgi 1-2 takrorgacha og'ir bo'lsin, texnikani buzmang.",
      "Haftasiga 0.25-0.5% vazn qo'shish yetarli, ko'pi yog'ga ketadi.",
      "Oqsil 1.6-2.2 g/kg, kuniga 4 marta taqsimlab yeng.",
      "Mashg'ulotdan keyin osh, guruch yoki non bilan go'sht: yaxshi tiklanish.",
    ],
  },
};

export function trainingPlan(goal: Goal): TrainingPlan {
  return PLANS[goal];
}
