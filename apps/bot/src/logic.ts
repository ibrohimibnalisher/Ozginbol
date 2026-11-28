import type { Activity, Goal, Sex } from "@ozginbol/core";
import {
  FASTING_PLANS, FASTING_WARNING, FAT_CATEGORY_LABELS, GOAL_INFO, MENU_MEAL_LABELS, adaptiveTdee, dayScore, fastingStatus, formatDuration, generateMenu, MEASURE_TIPS, RISK_LABELS, bodyComposition, caloriesBurned, measurementError, parseMeasurements, computeTargets, createCustomFood, createRecipeFood, formatUnit, getFood, parseCustomFoodLine,
  parseExercise, parseMeal, recipeLines, searchFoods, sourceText, trainingPlan,
  LANGS, MICRO_INFO, formatMicro, isLang, microGaps, microReport, microTargets, sumMicros,
} from "@ozginbol/core";
import type { Food } from "@ozginbol/core";
import type { Store, User } from "./db";
import { profileOf, tashkentDay } from "./db";
import { dayMessage, esc, help, mealMessage, targetsMessage, weekMessage } from "./format";
import { L, lang, withLang } from "./lang";

/** Transport-agnostic reply: the grammY layer turns `buttons` into an inline keyboard. */
export interface Reply {
  text: string;
  buttons?: { text: string; data: string }[][];
}

export const GOAL_LABELS: Record<Goal, string> = { cut: "sushka", lose: "ozish", maintain: "vaznni saqlash", gain: "massa nabor" };

const ACTIVITY_BUTTONS = () => [
  [{ text: `🪑 ${L("Kam harakat (ofis)")}`, data: "act:sedentary" }],
  [{ text: `🚶 ${L("Haftada 1-3 mashg'ulot")}`, data: "act:light" }],
  [{ text: `🏃 ${L("Haftada 3-5 mashg'ulot")}`, data: "act:moderate" }],
  [{ text: `🏋️ ${L("Har kuni mashg'ulot")}`, data: "act:active" }],
  [{ text: `👷 ${L("Og'ir jismoniy ish")}`, data: "act:very_active" }],
];

const GOAL_BUTTONS = () => [
  [{ text: `🔥 ${L("Sushka (quritish)")}`, data: "goal:cut" }, { text: `⬇️ ${L("Ozish")}`, data: "goal:lose" }],
  [{ text: `⚖️ ${L("Vaznni saqlash")}`, data: "goal:maintain" }, { text: `💪 ${L("Massa nabor")}`, data: "goal:gain" }],
];

function rateButtons(goal: Goal) {
  return [GOAL_INFO[goal].rates.map((r) => ({ text: `${r} ${L("kg/hafta")}${r === GOAL_INFO[goal].defaultRate ? " ✓" : ""}`, data: `rate:${r}` }))];
}

function showTargets(store: Store, userId: number): Reply {
  const u = store.getUser(userId)!;
  const p = profileOf(u);
  if (!p) return startOnboarding(store, u);
  return { text: targetsMessage(computeTargets(p), GOAL_LABELS[p.goal], p.targetWeightKg) };
}

export const MEAL_BUTTONS = () => [[
  { text: `↩️ ${L("Bekor qilish")}`, data: "undo" },
  { text: `ℹ️ ${L("Manba")}`, data: "src" },
  { text: `📊 ${L("Bugun")}`, data: "today" },
]];

function num(text: string): number | null {
  const m = text.replace(",", ".").match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export function startOnboarding(store: Store, user: User): Reply {
  store.updateUser(user.id, { step: "sex" });
  return {
    text: [
      `${L("Assalomu alaykum")}${user.name ? `, ${esc(user.name)}` : ""}! 👋`,
      "",
      L("Men <b>Ozginbol</b>man: nima yeganingizni yozsangiz, kaloriya, oqsil, yog' va uglevodni hisoblab, kunlik me'yoringiz bilan solishtirib boraman."),
      "",
      L("Shaxsiy me'yoringizni hisoblash uchun 5 ta savol. Jinsingiz?"),
      "",
      "🌐 /til: O'zbekcha · Русский · English",
    ].join("\n"),
    buttons: [[
      { text: `👨 ${L("Erkak")}`, data: "sex:male" },
      { text: `👩 ${L("Ayol")}`, data: "sex:female" },
    ]],
  };
}

/** Inline-button presses during onboarding and elsewhere. */
export function handleCallback(store: Store, user: User, data: string): Reply | null {
  if (data.startsWith("menu:")) {
    const [, action, seed] = data.split(":");
    return action === "add" ? addMenu(store, user, Number(seed)) : menu(store, user, Number(seed) + 1);
  }
  if (data.startsWith("rep:")) return repeatMeal(store, user, data.slice(4));
  if (data.startsWith("fast:")) return fast(store, user, data.slice(5));
  if (data.startsWith("lang:")) return setLang(store, user, data.slice(5));
  const [kind, value] = data.split(":") as [string, string | undefined];
  if (kind === "sex" && value) {
    store.updateUser(user.id, { sex: value as Sex, step: "age" });
    return { text: L("Yoshingiz nechada? (masalan: 28)") };
  }
  if (kind === "act" && value) {
    store.updateUser(user.id, { activity: value as Activity, step: "goal" });
    return { text: L("Maqsadingiz qanday?"), buttons: GOAL_BUTTONS() };
  }
  if (kind === "goal" && value) {
    const goal = value as Goal;
    if (goal === "maintain") {
      store.updateUser(user.id, { goal, step: "done", rateKgPerWeek: null, targetWeightKg: null });
      return showTargets(store, user.id);
    }
    store.updateUser(user.id, { goal, step: "rate" });
    return { text: L("Haftasiga qancha tezlikda? Sekinroq bo'lsa, natija barqarorroq bo'ladi."), buttons: rateButtons(goal) };
  }
  if (kind === "rate" && value) {
    store.updateUser(user.id, { rateKgPerWeek: Number(value), step: "target" });
    return { text: L("Maqsad vazningiz necha kg? (masalan: 70)"), buttons: [[{ text: L("O'tkazib yuborish"), data: "target:skip" }]] };
  }
  if (kind === "target") {
    store.updateUser(user.id, { step: "done", targetWeightKg: null });
    return showTargets(store, user.id);
  }
  if (kind === "src") return lastMealSources(store, user);
  if (kind === "del" && value) {
    const list = store.customFoods(user.id);
    const f = list[Number(value)];
    if (!f) return { text: L("Topilmadi.") };
    store.deleteCustomFood(user.id, f.id);
    return { text: `🗑 ${L('"{name}" o\'chirildi.', { name: esc(f.name.uz) })}` };
  }
  if (kind === "undo") return undo(store, user);
  if (kind === "help" && value === "yangi") return { text: newFoodHelp() };
  if (kind === "today") return today(store, user);
  if (kind === "vit") return vitamins(store, user);
  if (kind === "water" && value) return water(store, user, Number(value));
  return null;
}

/** Plain text: onboarding answers first, otherwise food or exercise. */
export function handleText(store: Store, user: User, text: string): Reply {
  const n = num(text);
  if (user.step === "age" && n !== null) {
    if (n < 10 || n > 100) return { text: L("Yoshni 10 dan 100 gacha raqam bilan yozing.") };
    store.updateUser(user.id, { age: Math.round(n), step: "height" });
    return { text: L("Bo'yingiz necha sm? (masalan: 172)") };
  }
  if (user.step === "height" && n !== null) {
    const cm = n < 3 ? n * 100 : n; // "1.72" -> 172
    if (cm < 120 || cm > 230) return { text: L("Bo'yni santimetrda yozing, masalan: 172") };
    store.updateUser(user.id, { heightCm: cm, step: "weight" });
    return { text: L("Vazningiz necha kg? (masalan: 74.5)") };
  }
  if (user.step === "target" && n !== null) {
    if (n < 30 || n > 300) return { text: L("Vaznni kilogrammda yozing, masalan: 70") };
    store.updateUser(user.id, { targetWeightKg: n, step: "done" });
    return showTargets(store, user.id);
  }
  if (user.step === "weight" && n !== null) {
    if (n < 30 || n > 300) return { text: L("Vaznni kilogrammda yozing, masalan: 74.5") };
    store.setWeight(user.id, n);
    store.updateUser(user.id, { step: "activity" });
    return { text: L("Kundalik faolligingiz qanday?"), buttons: ACTIVITY_BUTTONS() };
  }

  const meal = parseMeal(text, { extraFoods: store.customFoods(user.id) });
  // "30 daqiqa yugurdim": an exercise wins unless a food matched exactly
  if (parseExercise(text) && meal.items.every((i) => i.confidence < 0.95)) return workout(store, user, text);
  if (!meal.items.length && !meal.unknown.length) {
    return { text: L("Nima yeganingizni yozing, masalan: <code>2 ta somsa va 1 piyola choy</code>\nYordam: /yordam") };
  }
  if (meal.items.length) store.addEntries(user.id, meal.items);
  const t = targetsFor(user);
  return { text: mealMessage(meal, store.day(user.id), t), buttons: meal.items.length ? MEAL_BUTTONS() : [[{ text: `➕ ${L("O'z mahsulotimni qo'shish")}`, data: "help:yangi" }]] };
}

function targetsFor(user: User) {
  const p = profileOf(user);
  return p ? computeTargets(p) : null;
}

function scoreLine(store: Store, u: User): string {
  const t = targetsFor(u);
  const d = store.day(u.id);
  if (!t || !d.entries.length) return "";
  const cat = (id: string) => getFood(id)?.category;
  const q = dayScore(d.food, t, {
    burned: d.burned,
    waterMl: d.waterMl,
    plantsKcal: d.entries.filter((e) => cat(e.foodId) === "meva" || cat(e.foodId) === "sabzavot").reduce((a, e) => a + e.kcal, 0),
    sweetsKcal: d.entries.filter((e) => cat(e.foodId) === "shirinlik" || cat(e.foodId) === "fastfud").reduce((a, e) => a + e.kcal, 0),
  });
  return [`\n🏅 <b>${L("Kun bahosi")}: ${q.grade} (${q.score}/100)</b>`, ...q.good.slice(0, 2).map((g) => `✓ ${L(g)}`), ...q.improve.slice(0, 2).map((g) => `→ ${L(g)}`)].join("\n");
}

export function today(store: Store, user: User): Reply {
  const u = store.getUser(user.id) ?? user;
  return {
    text: dayMessage(store.day(u.id), targetsFor(u), u.weightKg) + scoreLine(store, u) + microLine(store, u),
    buttons: [[{ text: `💧 +250 ml ${L("suv")}`, data: "water:250" }, { text: `🥦 ${L("Vitaminlar")}`, data: "vit" }]],
  };
}

export function week(store: Store, user: User): Reply {
  const t = targetsFor(user);
  const ad = adaptiveTdee(store.dailyIntake(user.id, 60), store.weights(user.id, 90), 28, tashkentDay());
  const extra = ad
    ? `\n\n🔬 <b>${L("Haqiqiy sarfingiz: {n} kkal/kun", { n: ad.tdee })}</b>\n${L("{days} kunda o'rtacha {avg} kkal yedingiz, trend vazn {delta} kg.", { days: ad.days, avg: ad.avgIntake, delta: `${ad.trendChangeKg > 0 ? "+" : ""}${ad.trendChangeKg}` })}` +
      (t ? ` ${L("Formula bo'yicha: {n}.", { n: t.tdee })}${Math.abs(ad.tdee - t.tdee) > 150 ? ` ${L("Tavsiya: kuniga {n} kkal.", { n: ad.tdee + t.dailyDelta })}` : ""}` : "")
    : "";
  return { text: weekMessage(store.week(user.id), t, store.weights(user.id, 14)) + extra };
}

const clock = (ms: number) => new Date(ms + 5 * 3600_000).toISOString().slice(11, 16); // Tashkent time

export function fast(store: Store, user: User, arg: string): Reply {
  const a = (arg ?? "").trim().toLowerCase();
  const active = store.activeFast(user.id);
  if (["stop", "tugat", "to'xtat", "toxtat", "end"].includes(a)) {
    const f = store.endFast(user.id);
    if (!f) return { text: L("Faol ochlik yo'q. Boshlash: <code>/ochlik 16</code>") };
    const min = Math.round((f.endedAt - f.startedAt) / 60000);
    const ok = min >= f.hours * 60;
    return { text: `${ok ? `🎉 ${L("Ochlik yakunlandi")}` : `⏹ ${L("Ochlik to'xtatildi")}`}: ${L(formatDuration(min))} (${L("maqsad {n} soat", { n: f.hours })}).\n${L("Jami muvaffaqiyatli ochliklar: {n}.", { n: store.completedFasts(user.id) })}` };
  }
  const hours = parseFloat(a);
  if (hours) {
    if (!(hours >= 12 && hours <= 24)) return { text: L("Ochlik 12 dan 24 soatgacha bo'lsin, masalan: <code>/ochlik 16</code>") };
    store.startFast(user.id, hours);
    return {
      text: `⏳ <b>${L("{n} soatlik ochlik boshlandi", { n: hours })}</b> (${clock(Date.now())}). ${L("{t} da tugaydi.", { t: clock(Date.now() + hours * 3600_000) })}\n${L("Holatni ko'rish: /ochlik")}\n\n<i>${L(FASTING_WARNING)}</i>`,
      buttons: [[{ text: `⏹ ${L("To'xtatish")}`, data: "fast:stop" }]],
    };
  }
  if (active) {
    const st = fastingStatus(active.startedAt, active.hours);
    const bar = "▓".repeat(Math.round(st.progress * 10)) + "░".repeat(10 - Math.round(st.progress * 10));
    return {
      text: [
        `⏳ <b>${L("Ochlik")}: ${L(formatDuration(st.elapsedMin))}</b> / ${active.hours} ${L("soat")}`,
        `<code>${bar}</code> ${Math.round(st.progress * 100)}%`,
        st.done ? `🎉 ${L("Maqsadga yetdingiz!")}` : L("Qoldi: {d} ({t} da)", { d: L(formatDuration(st.remainingMin)), t: clock(st.endsAt) }),
        "",
        `<b>${L(st.stage.title)}</b>: ${L(st.stage.text)}`,
      ].join("\n"),
      buttons: [[{ text: st.done ? `✅ ${L("Yakunlash")}` : `⏹ ${L("To'xtatish")}`, data: "fast:stop" }]],
    };
  }
  return {
    text: [`⏳ <b>${L("Interval ochlik")}</b>`, "", ...FASTING_PLANS.map((p) => `<b>${p.label}</b>: ${L(p.hint)}`), "", L("Qaysi rejani boshlaymiz?")].join("\n"),
    buttons: [FASTING_PLANS.slice(0, 3).map((p) => ({ text: p.label, data: `fast:${p.fastHours}` })), FASTING_PLANS.slice(3).map((p) => ({ text: p.label, data: `fast:${p.fastHours}` }))],
  };
}

export function menu(store: Store, user: User, seed?: number): Reply {
  const u = store.getUser(user.id) ?? user;
  const t = targetsFor(u);
  if (!t) return { text: L("Avval kunlik me'yorni hisoblaylik: /maqsad") };
  const sd = seed ?? Math.floor(Date.now() / 86400000);
  const m = generateMenu({ calories: t.calories, protein: t.protein, goal: u.goal ?? undefined }, sd);
  const lines = [`🍽 <b>${L("Bugungi menyu")}</b> (${L("{kcal} kkal, oqsil {p} g", { kcal: m.total.kcal, p: Math.round(m.total.protein) })})`, ""];
  for (const x of m.meals) lines.push(`<b>${L(MENU_MEAL_LABELS[x.meal])}</b> · ${x.total.kcal} ${L("kkal")}`, esc(x.items.map((i) => `${i.food.name[lang()]} ${i.grams} ${i.food.liquid ? "ml" : "g"}`).join(", ")), "");
  lines.push(L("Me'yoringiz: {kcal} kkal, oqsil {p} g.", { kcal: t.calories, p: t.protein }));
  return {
    text: lines.join("\n"),
    buttons: [[{ text: `🔄 ${L("Boshqa variant")}`, data: `menu:next:${sd}` }, { text: `➕ ${L("Kundalikka")}`, data: `menu:add:${sd}` }]],
  };
}

function addMenu(store: Store, user: User, seed: number): Reply {
  const u = store.getUser(user.id) ?? user;
  const t = targetsFor(u);
  if (!t) return { text: L("Avval /maqsad") };
  const m = generateMenu({ calories: t.calories, protein: t.protein, goal: u.goal ?? undefined }, seed);
  store.addEntries(u.id, m.meals.flatMap((x) => x.items));
  return { text: `✅ ${L("Menyu kundalikka qo'shildi: {n} kkal. Yemagan ovqatni /ochir bilan olib tashlang.", { n: m.total.kcal })}` };
}

export function repeatList(store: Store, user: User): Reply {
  const recent = store.recentMeals(user.id, 6);
  if (!recent.length) return { text: L("Hali takrorlaydigan ovqat yo'q.") };
  return {
    text: `🔁 ${L("Qaysi ovqatni yana qo'shamiz?")}`,
    buttons: recent.map((r) => [{ text: `${r.text.slice(0, 40)} · ${r.kcal} ${L("kkal")}`, data: `rep:${r.meal}` }]),
  };
}

function repeatMeal(store: Store, user: User, meal: string): Reply {
  const rows = store.repeatMeal(user.id, meal);
  if (!rows.length) return { text: L("Bu ovqat topilmadi.") };
  const kcal = Math.round(rows.reduce((a, e) => a + e.kcal, 0));
  return { text: `✅ ${L("Yana qo'shildi")}: ${esc(rows.map((e) => e.input).join(", "))} (+${kcal} ${L("kkal")})\n${L("Bugungi holat: /bugun")}` };
}

/** Diary as CSV for Excel. */
export function exportCsv(store: Store, user: User): string {
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = store.allEntries(user.id).map((e) =>
    [e.day, q(getFood(e.foodId)?.name.uz ?? e.foodId), q(e.input), e.grams, Math.round(e.kcal), e.protein.toFixed(1), e.fat.toFixed(1), e.carbs.toFixed(1)].join(","),
  );
  return ["Sana,Taom,Yozilgan,Gramm,Kkal,Oqsil,Yog',Uglevod", ...rows].join("\n");
}

export function undo(store: Store, user: User): Reply {
  const removed = store.undoLast(user.id);
  if (!removed.length) return { text: L("O'chiradigan yozuv yo'q.") };
  const kcal = Math.round(removed.reduce((a, e) => a + e.kcal, 0));
  return { text: `↩️ ${L("O'chirildi")}: "${esc(removed[0]!.input)}"${removed.length > 1 ? ` ${L("va yana {n} ta", { n: removed.length - 1 })}` : ""} (−${kcal} ${L("kkal")})` };
}

export function water(store: Store, user: User, ml: number): Reply {
  const amount = ml > 0 && ml <= 3000 ? ml : 250;
  const total = store.addWater(user.id, amount);
  const t = targetsFor(user);
  return {
    text: `💧 +${amount} ml. ${L("Bugun")}: <b>${(total / 1000).toFixed(2)} l</b>${t ? ` / ${(t.waterMl / 1000).toFixed(1)} l` : ""}`,
    buttons: [[{ text: "💧 +250 ml", data: "water:250" }, { text: "💧 +500 ml", data: "water:500" }]],
  };
}

export function weight(store: Store, user: User, arg: string): Reply {
  const n = num(arg);
  if (n === null || n < 30 || n > 300) return { text: L("Vaznni yozing, masalan: <code>/vazn 78.5</code>") };
  store.setWeight(user.id, n);
  const hist = store.weights(user.id, 30);
  const first = hist[0]!;
  const diff = Math.round((n - first.kg) * 10) / 10;
  const u = store.getUser(user.id)!;
  const t = targetsFor(u);
  return {
    text: [
      `⚖️ ${L("Vazn yozildi")}: <b>${n} kg</b>`,
      hist.length > 1 ? L("{day} dan beri: {d} kg", { day: first.day, d: `${diff > 0 ? "+" : ""}${diff}` }) : "",
      t ? L("Yangi kunlik me'yor: {n} kkal", { n: t.calories }) : "",
    ].filter(Boolean).join("\n"),
  };
}

export function workout(store: Store, user: User, arg: string): Reply {
  const ex = parseExercise(arg);
  if (!ex) {
    return { text: L("Mashg'ulotni yozing, masalan: <code>/mashq 30 daqiqa yugurish</code>, <code>/mashq zal 1 soat</code>, <code>/mashq 45 min velosiped</code>") };
  }
  const w = user.weightKg ?? 70;
  const kcal = caloriesBurned(ex.exercise.id, w, ex.minutes);
  store.addWorkout(user.id, ex.exercise.id, ex.minutes, kcal);
  return {
    text: `🏃 ${ex.exercise.name[lang()]}, ${ex.minutes} ${L("daqiqa")}: <b>−${kcal} ${L("kkal")}</b>\n${L("Bugungi me'yoringizga qo'shildi.")}`,
    buttons: [[{ text: `📊 ${L("Bugun")}`, data: "today" }]],
  };
}

export function plan(user: User): Reply {
  const p = trainingPlan(user.goal ?? "maintain");
  const lines = [`🏋️ <b>${L(p.title)}</b>`, L(p.summary), ""];
  for (const d of p.week) {
    lines.push(`<b>${L(d.day)}: ${L(d.focus)}</b>`);
    for (const e of d.exercises) lines.push(`  • ${L(e)}`);
  }
  lines.push("", `<b>${L("Qoidalar")}</b>`);
  for (const r of p.rules) lines.push(`✅ ${L(r)}`);
  lines.push("", `<i>${L("Sog'lig'ingizda muammo bo'lsa, boshlashdan oldin shifokor bilan maslahatlashing.")}</i>`);
  return { text: lines.join("\n") };
}

function sourceBlock(f: Food): string {
  const lines = [`<b>${esc(f.name[lang()])}</b>`, `100 g: ${f.per100.kcal} ${L("kkal")} · ${L("O")} ${f.per100.protein} · ${L("Y")} ${f.per100.fat} · ${L("U")} ${f.per100.carbs}`];
  if (f.sizes) lines.push(`${L("Hajmi")}: ${Object.entries(f.sizes).map(([k, v]) => `${L(k === "orta" ? "o'rta" : k)} ${v} g`).join(", ")}`);
  lines.push(`<i>${L("Manba")}:</i> ${esc(sourceText(f, lang()))}`);
  const r = recipeLines(f, lang());
  if (r.length) {
    lines.push(`<i>${esc(L(f.recipe!.note))}</i>`);
    for (const l of r) lines.push(`  ${esc(l)}`);
  }
  if (f.micros) {
    const keys = ["sodium", "potassium", "calcium", "iron", "vitA", "vitC"] as const;
    lines.push(`🥦 ${keys.map((k) => `${MICRO_INFO[k].name[lang()]} ${formatMicro(k, f.micros![k])}`).join(" · ")}`);
  }
  return lines.join("\n");
}

function lastMealSources(store: Store, user: User): Reply {
  const d = store.day(user.id);
  const last = d.entries.at(-1);
  if (!last) return { text: L("Bugun hali hech narsa yozilmagan.") };
  const custom = store.customFoods(user.id);
  const ids = [...new Set(d.entries.filter((e) => e.at === last.at).map((e) => e.foodId))];
  const foods = ids.map((id) => getFood(id) ?? custom.find((f) => f.id === id)).filter(Boolean) as Food[];
  return { text: foods.map(sourceBlock).join("\n\n") || L("Manba topilmadi.") };
}

const NEW_FOOD_HELP_LINES = [
  "<b>O'z mahsulotingizni qo'shish</b>",
  "",
  "Yorliqdagi 100 g uchun qiymat: nomi, kkal, oqsil, yog', uglevod:",
  "<code>/yangi Agusha tvorog, 159, 18, 9, 2</code>",
  "1 dona og'irligini ham qo'shsangiz, \"2 ta ...\" deb yozish mumkin:",
  "<code>/yangi Mening nonim, 250, 8, 3, 48, dona 300</code>",
  "",
  "<b>O'z retseptingiz</b> (masalliqlar xom holida; tayyor og'irlik va porsiya ixtiyoriy):",
  "<code>/retsept Uy oshi: 1 kg guruch, 1 kg mol go'shti, 250 g yog', 1 kg sabzi | 4500 | 12</code>",
  "",
  "/mening: qo'shganlaringiz ro'yxati",
];
export const newFoodHelp = () => NEW_FOOD_HELP_LINES.map((l) => (l && !l.startsWith("<code>") ? L(l) : l)).join("\n");

export function newFood(store: Store, user: User, arg: string): Reply {
  const input = parseCustomFoodLine(arg);
  if (!input) return { text: newFoodHelp() };
  try {
    const food = createCustomFood(input);
    store.saveCustomFood(user.id, food);
    return {
      text: `✅ <b>${esc(food.name.uz)}</b> ${L("qo'shildi")}: ${L("100 g da {kcal} kkal", { kcal: food.per100.kcal })} · ${L("O")} ${food.per100.protein} · ${L("Y")} ${food.per100.fat} · ${L("U")} ${food.per100.carbs}${food.portions.dona ? `\n${L("1 dona {g} g", { g: food.portions.dona })}` : ""}\n\n${L("Endi oddiy yozing")}: <code>${food.portions.dona ? "1 ta" : "150 g"} ${esc(food.name.uz.toLowerCase())}</code>`,
    };
  } catch (e) {
    return { text: `⚠️ ${esc(L((e as Error).message))}\n\n${newFoodHelp()}` };
  }
}

export function newRecipe(store: Store, user: User, arg: string): Reply {
  const [head, yieldS, servS] = arg.split("|").map((x) => x.trim());
  const idx = (head ?? "").indexOf(":");
  if (idx < 1) return { text: newFoodHelp() };
  const name = head!.slice(0, idx).trim();
  const ingredients = head!.slice(idx + 1).trim();
  try {
    const { food, parsed } = createRecipeFood(
      { name, ingredients, yieldG: yieldS ? parseFloat(yieldS) : undefined, servings: servS ? parseFloat(servS) : undefined },
      store.customFoods(user.id),
    );
    store.saveCustomFood(user.id, food);
    const lines = [`✅ ${L("Retsept")} <b>${esc(food.name.uz)}</b> ${L("saqlandi")}`, ""];
    for (const i of parsed.items) lines.push(`• ${i.grams} g ${esc(i.food.name[lang()])}: ${i.nutrition.kcal} ${L("kkal")}`);
    if (parsed.unknown.length) lines.push(`⚠️ ${L("Topilmadi")}: ${esc(parsed.unknown.join(", "))}`);
    lines.push("", `<b>${L("100 g da {kcal} kkal", { kcal: food.per100.kcal })}</b> · ${L("O")} ${food.per100.protein} · ${L("Y")} ${food.per100.fat} · ${L("U")} ${food.per100.carbs}`);
    if (food.portions.porsiya) lines.push(L("1 porsiya {g} g = {kcal} kkal", { g: food.portions.porsiya, kcal: Math.round((food.per100.kcal * food.portions.porsiya) / 100) }));
    if (!yieldS) lines.push("", `<i>${L("Tayyor taomni tortib, og'irligini | dan keyin yozsangiz aniqroq bo'ladi.")}</i>`);
    return { text: lines.join("\n") };
  } catch (e) {
    return { text: `⚠️ ${esc(L((e as Error).message))}\n\n${newFoodHelp()}` };
  }
}

export function myFoods(store: Store, user: User): Reply {
  const list = store.customFoods(user.id);
  if (!list.length) return { text: `${L("Hali o'z mahsulotingiz yo'q.")}\n\n${newFoodHelp()}` };
  return {
    text: [`<b>${L("Mening mahsulotlarim")}</b>`, "", ...list.map((f, i) => `${i + 1}. ${esc(f.name.uz)}: ${L("100 g da {kcal} kkal", { kcal: f.per100.kcal })}${f.recipe ? ` (${L("retsept")})` : ""}`)].join("\n"),
    buttons: list.slice(0, 20).map((f, i) => [{ text: `🗑 ${f.name.uz}`.slice(0, 60), data: `del:${i}` }]),
  };
}

export function findFood(store: Store, user: User, arg: string): Reply {
  if (!arg.trim()) return { text: L("Taom nomini yozing: <code>/taom manti</code>") };
  const found = searchFoods(arg, 3, store.customFoods(user.id));
  if (!found.length) return { text: L('"{q}" topilmadi.', { q: esc(arg) }) };
  return { text: found.map(sourceBlock).join("\n\n") };
}

export function toggleReminder(store: Store, user: User): Reply {
  const u = store.updateUser(user.id, { remind: user.remind ? 0 : 1 });
  return { text: u.remind ? `🔔 ${L("Eslatmalar yoqildi: 13:00 va 20:30 da.")}` : `🔕 ${L("Eslatmalar o'chirildi.")}` };
}

/** Reminder text for a user at a given Tashkent hour, or null if nothing to say. */
export function reminderFor(store: Store, user: User, kind: "lunch" | "evening"): string | null {
  const d = store.day(user.id, tashkentDay());
  if (kind === "lunch") {
    return d.entries.length ? null : `🍽 ${L("Nonushta va tushlikda nima yedingiz? Yozib qo'ying, hisoblab beraman.")}`;
  }
  if (!d.entries.length) return `🌙 ${L("Bugun hech narsa yozilmadi. Bugun nima yeganingizni yozib qo'ysangiz, hisobot tayyorlab beraman.")}`;
  return dayMessage(d, targetsFor(user), user.weightKg, "Kun yakuni");
}

export { help };

const MEASURE_HELP = () => [
  `📏 <b>${L("Yog' foizi va o'lchamlar")}</b> (${L("US Navy lenta usuli")})`,
  "",
  L("Santimetr lenta bilan o'lchab yozing:"),
  "<code>/olcham bo'yin 38 bel 85</code>",
  L("Ayollar son aylanasini ham: <code>/olcham bo'yin 32 bel 72 son 98</code>"),
  L("Vaznni ham yangilash: <code>/olcham bo'yin 38 bel 85 vazn 78</code>"),
  "",
  ...MEASURE_TIPS.map((t) => `• <b>${L(t.label)}:</b> ${L(t.tip)}`),
  `• ${L("Ertalab, och qoringa o'lchang. Haftada bir marta yetarli.")}`,
].join("\n");

const sign = (x: number) => (x > 0 ? `+${x}` : String(x));

export function measure(store: Store, user: User, arg: string): Reply {
  const u = store.getUser(user.id) ?? user;
  const hist = store.measurements(u.id, 30);
  const parsed = parseMeasurements(arg ?? "");
  if (parsed.neckCm === undefined || parsed.waistCm === undefined) {
    const lines = hist.slice(-6).reverse().map((h) => `${h.day.slice(5).split("-").reverse().join(".")}: <b>${h.bodyFatPct}%</b> · ${L("bel")} ${h.waistCm} · ${L("bo'yin")} ${h.neckCm} · ${h.weightKg} kg`);
    return { text: [MEASURE_HELP(), lines.length ? `\n<b>${L("Oxirgi o'lchovlar")}</b>\n` + lines.join("\n") : ""].filter(Boolean).join("\n") };
  }
  if (!u.sex || !u.heightCm || !(parsed.weightKg ?? u.weightKg)) {
    return { text: L("Avval jins, bo'y va vazningizni kiriting: /maqsad") };
  }
  if (parsed.weightKg !== undefined) {
    if (parsed.weightKg < 30 || parsed.weightKg > 300) return { text: L("Vazn 30-300 kg oralig'ida bo'lsin.") };
    store.setWeight(u.id, parsed.weightKg);
  }
  const m = {
    sex: u.sex,
    age: u.age ?? undefined,
    heightCm: u.heightCm,
    weightKg: parsed.weightKg ?? u.weightKg!,
    neckCm: parsed.neckCm,
    waistCm: parsed.waistCm,
    hipCm: parsed.hipCm,
  };
  const err = measurementError(m);
  if (err) return { text: `⚠️ ${L(err)}.\n\n${MEASURE_HELP()}` };
  const b = bodyComposition(m);
  const day = tashkentDay();
  const earlier = hist.filter((h) => h.day !== day);
  const prev = earlier[earlier.length - 1];
  const first = earlier[0];
  store.saveMeasurement(u.id, { day, neckCm: m.neckCm, waistCm: m.waistCm, hipCm: m.hipCm, weightKg: m.weightKg, bodyFatPct: b.bodyFatPct });
  const t = targetsFor(store.getUser(u.id)!);
  const lines = [
    `📏 <b>${L("O'lchov yozildi")}</b>`,
    "",
    L("Yog' foizi: <b>{pct}%</b> ({cat}). Sog'lom oraliq: {a}-{b}%", { pct: b.bodyFatPct, cat: L(FAT_CATEGORY_LABELS[b.category]), a: b.healthyRange[0], b: b.healthyRange[1] }),
    L("Yog' massasi: {f} kg · yog'siz massa: {l} kg", { f: b.fatMassKg, l: b.leanMassKg }),
    L("Bel ÷ bo'y: {r} (xavf: {x}) · bel bo'yicha xavf: {y}", { r: b.waistToHeight.toFixed(2), x: L(RISK_LABELS[b.whtrRisk]), y: L(RISK_LABELS[b.waistRisk]) }),
    prev
      ? `\n${L("Oldingi o'lchovdan ({day}): yog' {f}%, bel {w} sm, vazn {kg} kg", { day: prev.day, f: sign(Math.round((b.bodyFatPct - prev.bodyFatPct) * 10) / 10), w: sign(Math.round((m.waistCm - prev.waistCm) * 10) / 10), kg: sign(Math.round((m.weightKg - prev.weightKg) * 10) / 10) })}`
      : "",
    first && first !== prev ? L("Boshidan ({day}): yog' {f}%, bel {w} sm", { day: first.day, f: sign(Math.round((b.bodyFatPct - first.bodyFatPct) * 10) / 10), w: sign(Math.round((m.waistCm - first.waistCm) * 10) / 10) }) : "",
    t ? `\n${L("Kunlik me'yor endi yog' foizi bilan (Katch-McArdle) hisoblanadi: <b>{kcal} kkal</b>, oqsil {p} g.", { kcal: t.calories, p: t.protein })}` : "",
    "",
    `<b>${L("Qanday hisoblandi")}</b>`,
    ...b.steps.map((s, i) => `${i + 1}. ${esc(L(s))}`),
  ];
  return { text: lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n") };
}

/** /til: pick the reply language. */
export function langMenu(): Reply {
  return {
    text: "🌐 Tilni tanlang · Выберите язык · Choose language",
    buttons: [LANGS.map((l) => ({ text: `${l.id === lang() ? "✓ " : ""}${l.label}`, data: `lang:${l.id}` }))],
  };
}

function setLang(store: Store, user: User, value: string): Reply {
  if (!isLang(value)) return langMenu();
  store.updateUser(user.id, { lang: value });
  return withLang(value, () => ({ text: `✅ ${L("Til: O'zbekcha")}\n\n${help()}` }));
}

/** One line under /bugun: what is running low today. */
function microLine(store: Store, u: User): string {
  if (!u.sex || !u.age) return "";
  const d = store.day(u.id);
  if (!d.entries.length) return "";
  const { micros } = sumMicros(d.entries, store.customFoods(u.id));
  const rows = microReport(micros, microTargets({ sex: u.sex, age: u.age }));
  const gaps = microGaps(rows, 3);
  const salt = rows.find((r) => r.key === "sodium");
  const parts: string[] = [];
  if (gaps.length) parts.push(`${L("Kam")}: ${gaps.map((g) => MICRO_INFO[g.key].name[lang()]).join(", ")}`);
  if (salt?.status === "over") parts.push(L("Tuz me'yordan ko'p ({n}%)", { n: salt.pct ?? 0 }));
  return parts.length ? `\n🥦 ${parts.join(" · ")} → /vitamin` : "";
}

/** /vitamin: today's vitamins and minerals against the daily reference intake. */
export function vitamins(store: Store, user: User): Reply {
  const u = store.getUser(user.id) ?? user;
  const d = store.day(u.id);
  if (!d.entries.length) return { text: L("Bugun hali hech narsa yozilmagan.") };
  const { micros, coverage } = sumMicros(d.entries, store.customFoods(u.id));
  const rows = microReport(micros, microTargets({ sex: u.sex ?? "male", age: u.age ?? 30 })).filter((r) => r.kind !== "info");
  const mark = (s: string) => (s === "over" ? "🔴" : s === "good" ? "🟢" : s === "fair" ? "🟡" : "⚪️");
  const lines = [`🥦 <b>${L("Vitamin va minerallar")}</b> (${L("bugun")})`, ""];
  for (const r of rows) {
    lines.push(`${mark(r.status)} ${MICRO_INFO[r.key].name[lang()]}: <b>${formatMicro(r.key, r.amount)}</b> / ${r.kind === "max" ? "≤ " : ""}${formatMicro(r.key, r.target!)} · ${r.pct}%`);
  }
  lines.push(`\n${L("Shakar (jami)")}: ${formatMicro("sugar", micros.sugar)}`);
  const gaps = microGaps(rows);
  if (gaps.length) {
    lines.push("", `<b>${L("Kam bo'lyapti")}</b>`);
    for (const g of gaps) lines.push(`• ${MICRO_INFO[g.key].name[lang()]}: ${MICRO_INFO[g.key].sources.map((x) => L(x)).join(", ")}`);
  }
  if (coverage < 0.95) lines.push("", `<i>${L("{n}% ovqat hisobga olindi", { n: Math.round(coverage * 100) })}: ${L("o'z mahsulotlaringizda vitamin ma'lumoti yo'q.")}</i>`);
  lines.push("", `<i>${L("Me'yorlar: AQSh Milliy akademiyalari (NIH) kunlik me'yorlari, yosh va jinsingiz bo'yicha. Qiymatlar USDA bazasidan.")}</i>`);
  return { text: lines.join("\n") };
}
