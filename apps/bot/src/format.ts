import type { Macros, ParseResult, Targets } from "@ozginbol/core";
import { formatUnit, getFood, minutesToBurn, monthDay, searchFoods } from "@ozginbol/core";
import { L, lang } from "./lang";
import type { DaySummary } from "./db";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const r0 = (n: number) => Math.round(n);

export function bar(value: number, target: number, width = 10): string {
  const ratio = target > 0 ? value / target : 0;
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return "▓".repeat(filled) + "░".repeat(width - filled);
}

function macroLine(m: Macros): string {
  return `${L("O")} ${r0(m.protein)} g · ${L("Y")} ${r0(m.fat)} g · ${L("U")} ${r0(m.carbs)} g`;
}

const WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export function mealMessage(r: ParseResult, today: DaySummary, targets: Targets | null): string {
  const lines: string[] = [];
  if (r.items.length) {
    lines.push(`🍽 <b>${L("Kundalikka qo'shildi")}</b>`);
    for (const it of r.items) {
      const portion = it.unit === "g" || it.unit === "ml" ? `${it.grams} ${it.unit}` : `${formatUnit(it.unit, it.quantity, lang())}, ${it.grams} ${it.food.liquid ? "ml" : "g"}`;
      const guess = it.confidence < 0.9 ? ` <i>(${L('"{input}" deb tushundim', { input: esc(it.input) })})</i>` : "";
      lines.push(`• ${esc(it.food.name[lang()])}, ${portion}: <b>${it.nutrition.kcal}</b> ${L("kkal")}${guess}`);
    }
    if (r.items.length > 1) lines.push(`${L("Jami")}: <b>${r.total.kcal} ${L("kkal")}</b> · ${macroLine(r.total)}`);
    else lines.push(macroLine(r.total));
  }
  if (r.unknown.length) {
    lines.push("");
    for (const u of r.unknown) {
      const sugg = searchFoods(u, 3).map((f) => f.name[lang()]);
      lines.push(`⚠️ ${L('"{u}" bazada topilmadi.', { u: esc(u) })}${sugg.length ? ` ${L("Balki")}: ${esc(sugg.join(", "))}?` : ""}`);
    }
    lines.push(L("Taomni boshqacha yozib ko'ring yoki grammini qo'shing, masalan: <code>200 g guruch</code>"));
  }
  if (r.items.length) {
    lines.push("");
    lines.push(todayLine(today, targets));
  }
  return lines.join("\n");
}

function todayLine(d: DaySummary, t: Targets | null): string {
  const eaten = r0(d.food.kcal);
  if (!t) return L("Bugun jami: <b>{n} kkal</b>. Shaxsiy me'yor uchun /maqsad", { n: eaten });
  const budget = t.calories + r0(d.burned);
  const left = budget - eaten;
  const pct = Math.round((eaten / budget) * 100);
  return [
    L("Bugun: <b>{a}</b> / {b} kkal", { a: eaten, b: budget }),
    `${bar(eaten, budget)} ${pct}%`,
    left >= 0 ? L("Yana <b>{n}</b> kkal yeyish mumkin", { n: left }) : `⚠️ ${L("Me'yordan <b>{n}</b> kkal oshdi", { n: -left })}`,
  ].join("\n");
}

export function dayMessage(d: DaySummary, t: Targets | null, weightKg: number | null, title = "Bugun"): string {
  const lines = [`📊 <b>${L(title)}</b>`];
  if (!d.entries.length) {
    lines.push("", L("Hali hech narsa yozilmagan. Nima yeganingizni yozing, masalan: <code>2 ta somsa va choy</code>"));
  } else {
    lines.push("");
    for (const e of d.entries) {
      const f = getFood(e.foodId);
      lines.push(`• ${esc(f?.name[lang()] ?? e.foodId)}, ${e.grams} ${f?.liquid ? "ml" : "g"}: ${r0(e.kcal)} ${L("kkal")}`);
    }
    lines.push("");
    lines.push(todayLine(d, t));
    if (t) {
      lines.push("");
      const w = Math.max(...["Oqsil", "Yog'", "Uglevod"].map((x) => L(x).length));
      lines.push(`<code>${L("Oqsil").padEnd(w)} ${bar(d.food.protein, t.protein, 8)} ${r0(d.food.protein)}/${t.protein} g</code>`);
      lines.push(`<code>${L("Yog'").padEnd(w)} ${bar(d.food.fat, t.fat, 8)} ${r0(d.food.fat)}/${t.fat} g</code>`);
      lines.push(`<code>${L("Uglevod").padEnd(w)} ${bar(d.food.carbs, t.carbs, 8)} ${r0(d.food.carbs)}/${t.carbs} g</code>`);
    } else {
      lines.push(macroLine(d.food));
    }
  }
  const extras: string[] = [];
  if (d.waterMl) extras.push(`💧 ${L("Suv")}: ${(d.waterMl / 1000).toFixed(2).replace(/0$/, "")} l${t ? ` / ${(t.waterMl / 1000).toFixed(1)} l` : ""}`);
  if (d.burned) extras.push(`🏃 ${L("Mashg'ulot")}: −${r0(d.burned)} ${L("kkal")}`);
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
    tips.push(L("Ortiqcha {n} kkalni yoqish uchun taxminan {m} daqiqa tez yuring.", { n: r0(over), m: minutesToBurn("walk_fast", w, over) }));
  }
  const hourTashkent = new Date(Date.now() + 5 * 3600_000).getUTCHours();
  if (hourTashkent >= 15 && d.food.protein < t.protein * 0.5) {
    tips.push(L("Oqsil kam. Tuxum, tovuq ko'kragi, tvorog, qatiq yoki mol go'shti qo'shing."));
  }
  if (d.food.fat > t.fat * 1.15) {
    tips.push(L("Yog' ko'p bo'ldi. Osh va somsani yarim porsiya qilib, achchiq-chuchuk yoki ko'k salat bilan yeng."));
  }
  if (t.waterMl && d.waterMl < t.waterMl * 0.5 && hourTashkent >= 14) {
    tips.push(L("Suv kam ichilyapti. /suv bilan belgilab boring."));
  }
  return tips.slice(0, 2);
}

export function weekMessage(days: DaySummary[], t: Targets | null, weights: { day: string; kg: number }[]): string {
  const logged = days.filter((d) => d.entries.length);
  const lines = [`📅 <b>${L("Oxirgi 7 kun")}</b>`, ""];
  const max = Math.max(t?.calories ?? 0, ...days.map((d) => d.food.kcal), 1);
  for (const d of days) {
    const wd = L(WEEKDAYS[new Date(`${d.day}T00:00:00Z`).getUTCDay()]!);
    const k = r0(d.food.kcal);
    lines.push(`<code>${wd.padEnd(4)} ${bar(k, max, 10)} ${k ? String(k).padStart(4) : "   —"}</code>`);
  }
  if (logged.length) {
    const avg = r0(logged.reduce((a, d) => a + d.food.kcal, 0) / logged.length);
    lines.push("", L("O'rtacha: <b>{avg} kkal</b> ({n} kun yozilgan)", { avg, n: logged.length }));
    if (t) {
      const inRange = logged.filter((d) => Math.abs(d.food.kcal - (t.calories + d.burned)) <= t.calories * 0.1).length;
      lines.push(L("Me'yorda (±10%): {a} / {b} kun", { a: inRange, b: logged.length }));
      const avgP = r0(logged.reduce((a, d) => a + d.food.protein, 0) / logged.length);
      lines.push(L("O'rtacha oqsil: {a} / {b} g", { a: avgP, b: t.protein }));
    }
  } else {
    lines.push("", L("Bu hafta hech narsa yozilmagan."));
  }
  if (weights.length >= 2) {
    const first = weights[0]!;
    const last = weights[weights.length - 1]!;
    const diff = Math.round((last.kg - first.kg) * 10) / 10;
    lines.push(`⚖️ ${L("Vazn")}: ${first.kg} → ${last.kg} kg (${diff > 0 ? "+" : ""}${diff} kg)`);
  }
  return lines.join("\n");
}

export function targetsMessage(t: Targets, goal: string, targetWeightKg?: number): string {
  const pct = (g: number, k: number) => Math.round(((g * k) / t.calories) * 100);
  const lines = [
    `🎯 <b>${L("Kunlik me'yoringiz")}</b> (${L(goal)})`,
    "",
    `${L("Kaloriya")}: <b>${t.calories} ${L("kkal")}</b>`,
    `${L("Oqsil")}: ${t.protein} g (${pct(t.protein, 4)}%) · ${L("Yog'")}: ${t.fat} g (${pct(t.fat, 9)}%) · ${L("Uglevod")}: ${t.carbs} g (${pct(t.carbs, 4)}%)`,
    `${L("Suv")}: ${(t.waterMl / 1000).toFixed(1)} l · ${L("Kletchatka")}: ${t.fiber} g`,
  ];
  if (t.weeksToTarget !== null && targetWeightKg) {
    const d = new Date(Date.now() + t.weeksToTarget * 7 * 86_400_000);
    lines.push("", `🏁 ${L("{kg} kg ga taxminan {w} haftada yetasiz ({date}).", { kg: targetWeightKg, w: t.weeksToTarget, date: monthDay(d.getDate(), d.getMonth() + 1, lang()) })}`);
  }
  for (const w of t.warnings) lines.push(`⚠️ ${esc(L(w))}`);
  lines.push("", `<b>${L("Qanday hisoblandi")}:</b>`);
  t.steps.forEach((s, i) => lines.push(`${i + 1}. ${esc(L(s))}`));
  lines.push(
    "",
    L("TMI {bmi}. Bo'yingiz uchun sog'lom vazn: {a}-{b} kg.", { bmi: t.bmi, a: t.healthyWeight[0], b: t.healthyWeight[1] }),
    "",
    L("Endi nima yeganingizni yozib boring: <code>1 kosa lag'mon va 2 bo'lak non</code>"),
  );
  return lines.join("\n");
}

const HELP_LINES = [
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
  "/menyu: me'yoringizga mos kunlik menyu",
  "/ochlik: interval ochlik (<code>/ochlik 16</code>, to'xtatish: <code>/ochlik stop</code>)",
  "/takror: oldingi ovqatni bir bosishda qo'shish",
  "/eksport: kundalikni Excel (CSV) faylida olish",
  "/olcham: yog' foizi (<code>/olcham bo'yin 38 bel 85</code>)",
  "/maqsad: shaxsiy me'yorni qayta hisoblash",
  "/mashqlar: maqsadingizga mos mashg'ulot rejasi",
  "/eslatma: kunlik eslatmani yoqish/o'chirish",
  "/taom: taom va kaloriyasining manbasi (<code>/taom somsa</code>)",
  "/yangi: o'z mahsulotingiz (<code>/yangi Agusha tvorog, 159, 18, 9, 2</code>)",
  "/retsept: o'z retseptingiz masalliqlardan",
  "/mening: qo'shgan mahsulotlaringiz",
  "/vitamin: bugungi vitamin va minerallar",
  "/til: tilni almashtirish · язык · language",
];

/** Help text in the current reply language. */
export function help(): string {
  return HELP_LINES.map((l) => (l ? L(l) : l)).join("\n");
}
