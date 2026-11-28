import type { Macros, ParseResult, Targets } from "@ozginbol/core";
import { formatUnit, getFood, minutesToBurn, searchFoods } from "@ozginbol/core";
import type { DaySummary } from "./db";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const r0 = (n: number) => Math.round(n);

export function bar(value: number, target: number, width = 10): string {
  const ratio = target > 0 ? value / target : 0;
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return "▓".repeat(filled) + "░".repeat(width - filled);
}

function macroLine(m: Macros): string {
  return `O ${r0(m.protein)} g · Y ${r0(m.fat)} g · U ${r0(m.carbs)} g`;
}

const WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

export function mealMessage(r: ParseResult, today: DaySummary, targets: Targets | null): string {
  const lines: string[] = [];
  if (r.items.length) {
    lines.push("🍽 <b>Kundalikka qo'shildi</b>");
    for (const it of r.items) {
      const portion = it.unit === "g" || it.unit === "ml" ? `${it.grams} ${it.unit}` : `${formatUnit(it.unit, it.quantity)}, ${it.grams} ${it.food.liquid ? "ml" : "g"}`;
      const guess = it.confidence < 0.9 ? ` <i>("${esc(it.input)}" deb tushundim)</i>` : "";
      lines.push(`• ${esc(it.food.name.uz)}, ${portion}: <b>${it.nutrition.kcal}</b> kkal${guess}`);
    }
    if (r.items.length > 1) lines.push(`Jami: <b>${r.total.kcal} kkal</b> · ${macroLine(r.total)}`);
    else lines.push(macroLine(r.total));
  }
  if (r.unknown.length) {
    lines.push("");
    for (const u of r.unknown) {
      const sugg = searchFoods(u, 3).map((f) => f.name.uz);
      lines.push(`⚠️ "${esc(u)}" bazada topilmadi.${sugg.length ? ` Balki: ${esc(sugg.join(", "))}?` : ""}`);
    }
    lines.push("Taomni boshqacha yozib ko'ring yoki grammini qo'shing, masalan: <code>200 g guruch</code>");
  }
  if (r.items.length) {
    lines.push("");
    lines.push(todayLine(today, targets));
  }
  return lines.join("\n");
}

function todayLine(d: DaySummary, t: Targets | null): string {
  const eaten = r0(d.food.kcal);
  if (!t) return `Bugun jami: <b>${eaten} kkal</b>. Shaxsiy me'yor uchun /maqsad`;
  const budget = t.calories + r0(d.burned);
  const left = budget - eaten;
  const pct = Math.round((eaten / budget) * 100);
  return [
    `Bugun: <b>${eaten}</b> / ${budget} kkal`,
    `${bar(eaten, budget)} ${pct}%`,
    left >= 0 ? `Yana <b>${left}</b> kkal yeyish mumkin` : `⚠️ Me'yordan <b>${-left}</b> kkal oshdi`,
  ].join("\n");
}

export function dayMessage(d: DaySummary, t: Targets | null, weightKg: number | null, title = "Bugun"): string {
  const lines = [`📊 <b>${title}</b>`];
  if (!d.entries.length) {
    lines.push("", "Hali hech narsa yozilmagan. Nima yeganingizni yozing, masalan: <code>2 ta somsa va choy</code>");
  } else {
    lines.push("");
    for (const e of d.entries) {
      const f = getFood(e.foodId);
      lines.push(`• ${esc(f?.name.uz ?? e.foodId)}, ${e.grams} ${f?.liquid ? "ml" : "g"}: ${r0(e.kcal)} kkal`);
    }
    lines.push("");
    lines.push(todayLine(d, t));
    if (t) {
      lines.push("");
      lines.push(`<code>Oqsil   ${bar(d.food.protein, t.protein, 8)} ${r0(d.food.protein)}/${t.protein} g</code>`);
      lines.push(`<code>Yog'    ${bar(d.food.fat, t.fat, 8)} ${r0(d.food.fat)}/${t.fat} g</code>`);
      lines.push(`<code>Uglevod ${bar(d.food.carbs, t.carbs, 8)} ${r0(d.food.carbs)}/${t.carbs} g</code>`);
    } else {
      lines.push(macroLine(d.food));
    }
  }
  const extras: string[] = [];
  if (d.waterMl) extras.push(`💧 Suv: ${(d.waterMl / 1000).toFixed(2).replace(/0$/, "")} l${t ? ` / ${(t.waterMl / 1000).toFixed(1)} l` : ""}`);
  if (d.burned) extras.push(`🏃 Mashg'ulot: −${r0(d.burned)} kkal`);
  if (extras.length) lines.push("", ...extras);
  const tips = dayTips(d, t, weightKg);
  if (tips.length) lines.push("", "💡 " + tips.join("\n💡 "));
  return lines.join("\n");
}

/** Short, concrete coaching based on what was eaten today. */
export function dayTips(d: DaySummary, t: Targets | null, weightKg: number | null): string[] {
  if (!t || !d.entries.length) return [];
  const tips: string[] = [];
  const budget = t.calories + d.burned;
  const over = d.food.kcal - budget;
  if (over > 100) {
    const w = weightKg ?? 70;
    tips.push(`Ortiqcha ${r0(over)} kkalni yoqish uchun taxminan ${minutesToBurn("walk_fast", w, over)} daqiqa tez yuring.`);
  }
  const hourTashkent = new Date(Date.now() + 5 * 3600_000).getUTCHours();
  if (hourTashkent >= 15 && d.food.protein < t.protein * 0.5) {
    tips.push("Oqsil kam. Tuxum, tovuq ko'kragi, tvorog, qatiq yoki mol go'shti qo'shing.");
  }
  if (d.food.fat > t.fat * 1.15) {
    tips.push("Yog' ko'p bo'ldi. Osh va somsani yarim porsiya qilib, achchiq-chuchuk yoki ko'k salat bilan yeng.");
  }
  if (t.waterMl && d.waterMl < t.waterMl * 0.5 && hourTashkent >= 14) {
    tips.push("Suv kam ichilyapti. /suv bilan belgilab boring.");
  }
  return tips.slice(0, 2);
}

export function weekMessage(days: DaySummary[], t: Targets | null, weights: { day: string; kg: number }[]): string {
  const logged = days.filter((d) => d.entries.length);
  const lines = ["📅 <b>Oxirgi 7 kun</b>", ""];
  const max = Math.max(t?.calories ?? 0, ...days.map((d) => d.food.kcal), 1);
  for (const d of days) {
    const wd = WEEKDAYS[new Date(`${d.day}T00:00:00Z`).getUTCDay()]!;
    const k = r0(d.food.kcal);
    lines.push(`<code>${wd.padEnd(4)} ${bar(k, max, 10)} ${k ? String(k).padStart(4) : "   —"}</code>`);
  }
  if (logged.length) {
    const avg = r0(logged.reduce((a, d) => a + d.food.kcal, 0) / logged.length);
    lines.push("", `O'rtacha: <b>${avg} kkal</b> (${logged.length} kun yozilgan)`);
    if (t) {
      const inRange = logged.filter((d) => Math.abs(d.food.kcal - (t.calories + d.burned)) <= t.calories * 0.1).length;
      lines.push(`Me'yorda (±10%): ${inRange} / ${logged.length} kun`);
      const avgP = r0(logged.reduce((a, d) => a + d.food.protein, 0) / logged.length);
      lines.push(`O'rtacha oqsil: ${avgP} / ${t.protein} g`);
    }
  } else {
    lines.push("", "Bu hafta hech narsa yozilmagan.");
  }
  if (weights.length >= 2) {
    const first = weights[0]!;
    const last = weights[weights.length - 1]!;
    const diff = Math.round((last.kg - first.kg) * 10) / 10;
    lines.push(`⚖️ Vazn: ${first.kg} → ${last.kg} kg (${diff > 0 ? "+" : ""}${diff} kg)`);
  }
  return lines.join("\n");
}

export function targetsMessage(t: Targets, goal: string, targetWeightKg?: number): string {
  const pct = (g: number, k: number) => Math.round(((g * k) / t.calories) * 100);
  const lines = [
    `🎯 <b>Kunlik me'yoringiz</b> (${goal})`,
    "",
    `Kaloriya: <b>${t.calories} kkal</b>`,
    `Oqsil: ${t.protein} g (${pct(t.protein, 4)}%) · Yog': ${t.fat} g (${pct(t.fat, 9)}%) · Uglevod: ${t.carbs} g (${pct(t.carbs, 4)}%)`,
    `Suv: ${(t.waterMl / 1000).toFixed(1)} l · Kletchatka: ${t.fiber} g`,
  ];
  if (t.weeksToTarget !== null && targetWeightKg) {
    const d = new Date(Date.now() + t.weeksToTarget * 7 * 86_400_000);
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    lines.push("", `🏁 ${targetWeightKg} kg ga taxminan <b>${t.weeksToTarget} haftada</b> yetasiz (${d.getDate()}-${months[d.getMonth()]}).`);
  }
  for (const w of t.warnings) lines.push(`⚠️ ${esc(w)}`);
  lines.push("", "<b>Qanday hisoblandi:</b>");
  t.steps.forEach((s, i) => lines.push(`${i + 1}. ${esc(s)}`));
  lines.push(
    "",
    `TMI ${t.bmi}. Bo'yingiz uchun sog'lom vazn: ${t.healthyWeight[0]}-${t.healthyWeight[1]} kg.`,
    "",
    "Endi nima yeganingizni yozib boring: <code>1 kosa lag'mon va 2 bo'lak non</code>",
  );
  return lines.join("\n");
}

export const HELP = [
  "<b>Ozginbol</b>: kaloriya hisoblovchi 🥗",
  "",
  "Nima yeganingizni oddiy yozing:",
  "<code>2 ta somsa va 1 piyola choy</code>",
  "<code>1 lagan osh, achchiq-chuchuk</code>",
  "<code>300 g tovuq ko'kragi, 200 g guruch</code>",
  "<code>1 katta somsa</code> (kichik / o'rta / katta)",
  "",
  "/bugun: bugungi hisobot",
  "/hafta: haftalik hisobot",
  "/ochir: oxirgi yozuvni o'chirish",
  "/suv: +250 ml suv (yoki <code>/suv 500</code>)",
  "/mashq: mashg'ulot (<code>/mashq 30 daqiqa yugurish</code>)",
  "/vazn: vaznni yozish (<code>/vazn 78.5</code>)",
  "/olcham: yog' foizi (<code>/olcham bo'yin 38 bel 85</code>)",
  "/maqsad: shaxsiy me'yorni qayta hisoblash",
  "/mashqlar: maqsadingizga mos mashg'ulot rejasi",
  "/eslatma: kunlik eslatmani yoqish/o'chirish",
  "/taom: taom va kaloriyasining manbasi (<code>/taom somsa</code>)",
  "/yangi: o'z mahsulotingiz (<code>/yangi Agusha tvorog, 159, 18, 9, 2</code>)",
  "/retsept: o'z retseptingiz masalliqlardan",
  "/mening: qo'shgan mahsulotlaringiz",
].join("\n");
