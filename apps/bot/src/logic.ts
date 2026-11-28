import type { Activity, Goal, Sex } from "@ozginbol/core";
import {
  GOAL_INFO, caloriesBurned, computeTargets, createCustomFood, createRecipeFood, formatUnit, getFood, parseCustomFoodLine,
  parseExercise, parseMeal, recipeLines, searchFoods, sourceText, trainingPlan,
} from "@ozginbol/core";
import type { Food } from "@ozginbol/core";
import type { Store, User } from "./db";
import { profileOf, tashkentDay } from "./db";
import { HELP, dayMessage, esc, mealMessage, targetsMessage, weekMessage } from "./format";

/** Transport-agnostic reply: the grammY layer turns `buttons` into an inline keyboard. */
export interface Reply {
  text: string;
  buttons?: { text: string; data: string }[][];
}

export const GOAL_LABELS: Record<Goal, string> = { cut: "sushka", lose: "ozish", maintain: "vaznni saqlash", gain: "massa nabor" };

const ACTIVITY_BUTTONS: { text: string; data: string }[][] = [
  [{ text: "🪑 Kam harakat (ofis)", data: "act:sedentary" }],
  [{ text: "🚶 Haftada 1-3 mashg'ulot", data: "act:light" }],
  [{ text: "🏃 Haftada 3-5 mashg'ulot", data: "act:moderate" }],
  [{ text: "🏋️ Har kuni mashg'ulot", data: "act:active" }],
  [{ text: "👷 Og'ir jismoniy ish", data: "act:very_active" }],
];

const GOAL_BUTTONS = [
  [{ text: "🔥 Sushka (quritish)", data: "goal:cut" }, { text: "⬇️ Ozish", data: "goal:lose" }],
  [{ text: "⚖️ Vaznni saqlash", data: "goal:maintain" }, { text: "💪 Massa nabor", data: "goal:gain" }],
];

function rateButtons(goal: Goal) {
  return [GOAL_INFO[goal].rates.map((r) => ({ text: `${r} kg/hafta${r === GOAL_INFO[goal].defaultRate ? " ✓" : ""}`, data: `rate:${r}` }))];
}

function showTargets(store: Store, userId: number): Reply {
  const u = store.getUser(userId)!;
  const p = profileOf(u);
  if (!p) return startOnboarding(store, u);
  return { text: targetsMessage(computeTargets(p), GOAL_LABELS[p.goal], p.targetWeightKg) };
}

export const MEAL_BUTTONS = [[
  { text: "↩️ Bekor qilish", data: "undo" },
  { text: "ℹ️ Manba", data: "src" },
  { text: "📊 Bugun", data: "today" },
]];

function num(text: string): number | null {
  const m = text.replace(",", ".").match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export function startOnboarding(store: Store, user: User): Reply {
  store.updateUser(user.id, { step: "sex" });
  return {
    text: [
      `Assalomu alaykum${user.name ? `, ${esc(user.name)}` : ""}! 👋`,
      "",
      "Men <b>Ozginbol</b>man: nima yeganingizni yozsangiz, kaloriya, oqsil, yog' va uglevodni hisoblab, kunlik me'yoringiz bilan solishtirib boraman.",
      "",
      "Shaxsiy me'yoringizni hisoblash uchun 5 ta savol. Jinsingiz?",
    ].join("\n"),
    buttons: [[
      { text: "👨 Erkak", data: "sex:male" },
      { text: "👩 Ayol", data: "sex:female" },
    ]],
  };
}

/** Inline-button presses during onboarding and elsewhere. */
export function handleCallback(store: Store, user: User, data: string): Reply | null {
  const [kind, value] = data.split(":") as [string, string | undefined];
  if (kind === "sex" && value) {
    store.updateUser(user.id, { sex: value as Sex, step: "age" });
    return { text: "Yoshingiz nechada? (masalan: 28)" };
  }
  if (kind === "act" && value) {
    store.updateUser(user.id, { activity: value as Activity, step: "goal" });
    return { text: "Maqsadingiz qanday?", buttons: GOAL_BUTTONS };
  }
  if (kind === "goal" && value) {
    const goal = value as Goal;
    if (goal === "maintain") {
      store.updateUser(user.id, { goal, step: "done", rateKgPerWeek: null, targetWeightKg: null });
      return showTargets(store, user.id);
    }
    store.updateUser(user.id, { goal, step: "rate" });
    return { text: "Haftasiga qancha tezlikda? Sekinroq bo'lsa, natija barqarorroq bo'ladi.", buttons: rateButtons(goal) };
  }
  if (kind === "rate" && value) {
    store.updateUser(user.id, { rateKgPerWeek: Number(value), step: "target" });
    return { text: "Maqsad vazningiz necha kg? (masalan: 70)", buttons: [[{ text: "O'tkazib yuborish", data: "target:skip" }]] };
  }
  if (kind === "target") {
    store.updateUser(user.id, { step: "done", targetWeightKg: null });
    return showTargets(store, user.id);
  }
  if (kind === "src") return lastMealSources(store, user);
  if (kind === "del" && value) {
    const list = store.customFoods(user.id);
    const f = list[Number(value)];
    if (!f) return { text: "Topilmadi." };
    store.deleteCustomFood(user.id, f.id);
    return { text: `🗑 "${esc(f.name.uz)}" o'chirildi.` };
  }
  if (kind === "undo") return undo(store, user);
  if (kind === "help" && value === "yangi") return { text: NEW_FOOD_HELP };
  if (kind === "today") return today(store, user);
  if (kind === "water" && value) return water(store, user, Number(value));
  return null;
}

/** Plain text: onboarding answers first, otherwise food or exercise. */
export function handleText(store: Store, user: User, text: string): Reply {
  const n = num(text);
  if (user.step === "age" && n !== null) {
    if (n < 10 || n > 100) return { text: "Yoshni 10 dan 100 gacha raqam bilan yozing." };
    store.updateUser(user.id, { age: Math.round(n), step: "height" });
    return { text: "Bo'yingiz necha sm? (masalan: 172)" };
  }
  if (user.step === "height" && n !== null) {
    const cm = n < 3 ? n * 100 : n; // "1.72" -> 172
    if (cm < 120 || cm > 230) return { text: "Bo'yni santimetrda yozing, masalan: 172" };
    store.updateUser(user.id, { heightCm: cm, step: "weight" });
    return { text: "Vazningiz necha kg? (masalan: 74.5)" };
  }
  if (user.step === "target" && n !== null) {
    if (n < 30 || n > 300) return { text: "Vaznni kilogrammda yozing, masalan: 70" };
    store.updateUser(user.id, { targetWeightKg: n, step: "done" });
    return showTargets(store, user.id);
  }
  if (user.step === "weight" && n !== null) {
    if (n < 30 || n > 300) return { text: "Vaznni kilogrammda yozing, masalan: 74.5" };
    store.setWeight(user.id, n);
    store.updateUser(user.id, { step: "activity" });
    return { text: "Kundalik faolligingiz qanday?", buttons: ACTIVITY_BUTTONS };
  }

  const meal = parseMeal(text, { extraFoods: store.customFoods(user.id) });
  // "30 daqiqa yugurdim": an exercise wins unless a food matched exactly
  if (parseExercise(text) && meal.items.every((i) => i.confidence < 0.95)) return workout(store, user, text);
  if (!meal.items.length && !meal.unknown.length) {
    return { text: "Nima yeganingizni yozing, masalan: <code>2 ta somsa va 1 piyola choy</code>\nYordam: /yordam" };
  }
  if (meal.items.length) store.addEntries(user.id, meal.items);
  const t = targetsFor(user);
  return { text: mealMessage(meal, store.day(user.id), t), buttons: meal.items.length ? MEAL_BUTTONS : [[{ text: "➕ O'z mahsulotimni qo'shish", data: "help:yangi" }]] };
}

function targetsFor(user: User) {
  const p = profileOf(user);
  return p ? computeTargets(p) : null;
}

export function today(store: Store, user: User): Reply {
  const u = store.getUser(user.id) ?? user;
  return {
    text: dayMessage(store.day(u.id), targetsFor(u), u.weightKg),
    buttons: [[{ text: "💧 +250 ml suv", data: "water:250" }]],
  };
}

export function week(store: Store, user: User): Reply {
  return { text: weekMessage(store.week(user.id), targetsFor(user), store.weights(user.id, 14)) };
}

export function undo(store: Store, user: User): Reply {
  const removed = store.undoLast(user.id);
  if (!removed.length) return { text: "O'chiradigan yozuv yo'q." };
  const kcal = Math.round(removed.reduce((a, e) => a + e.kcal, 0));
  return { text: `↩️ O'chirildi: "${esc(removed[0]!.input)}"${removed.length > 1 ? ` va yana ${removed.length - 1} ta` : ""} (−${kcal} kkal)` };
}

export function water(store: Store, user: User, ml: number): Reply {
  const amount = ml > 0 && ml <= 3000 ? ml : 250;
  const total = store.addWater(user.id, amount);
  const t = targetsFor(user);
  return {
    text: `💧 +${amount} ml. Bugun: <b>${(total / 1000).toFixed(2)} l</b>${t ? ` / ${(t.waterMl / 1000).toFixed(1)} l` : ""}`,
    buttons: [[{ text: "💧 +250 ml", data: "water:250" }, { text: "💧 +500 ml", data: "water:500" }]],
  };
}

export function weight(store: Store, user: User, arg: string): Reply {
  const n = num(arg);
  if (n === null || n < 30 || n > 300) return { text: "Vaznni yozing, masalan: <code>/vazn 78.5</code>" };
  store.setWeight(user.id, n);
  const hist = store.weights(user.id, 30);
  const first = hist[0]!;
  const diff = Math.round((n - first.kg) * 10) / 10;
  const u = store.getUser(user.id)!;
  const t = targetsFor(u);
  return {
    text: [
      `⚖️ Vazn yozildi: <b>${n} kg</b>`,
      hist.length > 1 ? `${first.day} dan beri: ${diff > 0 ? "+" : ""}${diff} kg` : "",
      t ? `Yangi kunlik me'yor: ${t.calories} kkal` : "",
    ].filter(Boolean).join("\n"),
  };
}

export function workout(store: Store, user: User, arg: string): Reply {
  const ex = parseExercise(arg);
  if (!ex) {
    return { text: "Mashg'ulotni yozing, masalan: <code>/mashq 30 daqiqa yugurish</code>, <code>/mashq zal 1 soat</code>, <code>/mashq 45 min velosiped</code>" };
  }
  const w = user.weightKg ?? 70;
  const kcal = caloriesBurned(ex.exercise.id, w, ex.minutes);
  store.addWorkout(user.id, ex.exercise.id, ex.minutes, kcal);
  return {
    text: `🏃 ${ex.exercise.name.uz}, ${ex.minutes} daqiqa: <b>−${kcal} kkal</b>\nBugungi me'yoringizga qo'shildi.`,
    buttons: [[{ text: "📊 Bugun", data: "today" }]],
  };
}

export function plan(user: User): Reply {
  const p = trainingPlan(user.goal ?? "maintain");
  const lines = [`🏋️ <b>${p.title}</b>`, p.summary, ""];
  for (const d of p.week) {
    lines.push(`<b>${d.day}: ${d.focus}</b>`);
    for (const e of d.exercises) lines.push(`  • ${e}`);
  }
  lines.push("", "<b>Qoidalar</b>");
  for (const r of p.rules) lines.push(`✅ ${r}`);
  lines.push("", "<i>Sog'lig'ingizda muammo bo'lsa, boshlashdan oldin shifokor bilan maslahatlashing.</i>");
  return { text: lines.join("\n") };
}

function sourceBlock(f: Food): string {
  const lines = [`<b>${esc(f.name.uz)}</b>`, `100 g: ${f.per100.kcal} kkal · O ${f.per100.protein} · Y ${f.per100.fat} · U ${f.per100.carbs}`];
  if (f.sizes) lines.push(`Hajmi: ${Object.entries(f.sizes).map(([k, v]) => `${k === "orta" ? "o'rta" : k} ${v} g`).join(", ")}`);
  lines.push(`<i>Manba:</i> ${esc(sourceText(f))}`);
  const r = recipeLines(f);
  if (r.length) {
    lines.push(`<i>${esc(f.recipe!.note)}</i>`);
    for (const l of r) lines.push(`  ${esc(l)}`);
  }
  return lines.join("\n");
}

function lastMealSources(store: Store, user: User): Reply {
  const d = store.day(user.id);
  const last = d.entries.at(-1);
  if (!last) return { text: "Bugun hali hech narsa yozilmagan." };
  const custom = store.customFoods(user.id);
  const ids = [...new Set(d.entries.filter((e) => e.at === last.at).map((e) => e.foodId))];
  const foods = ids.map((id) => getFood(id) ?? custom.find((f) => f.id === id)).filter(Boolean) as Food[];
  return { text: foods.map(sourceBlock).join("\n\n") || "Manba topilmadi." };
}

export const NEW_FOOD_HELP = [
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
].join("\n");

export function newFood(store: Store, user: User, arg: string): Reply {
  const input = parseCustomFoodLine(arg);
  if (!input) return { text: NEW_FOOD_HELP };
  try {
    const food = createCustomFood(input);
    store.saveCustomFood(user.id, food);
    return {
      text: `✅ <b>${esc(food.name.uz)}</b> qo'shildi: 100 g da ${food.per100.kcal} kkal · O ${food.per100.protein} · Y ${food.per100.fat} · U ${food.per100.carbs}${food.portions.dona ? `\n1 dona = ${food.portions.dona} g` : ""}\n\nEndi oddiy yozing: <code>${food.portions.dona ? "1 ta" : "150 g"} ${esc(food.name.uz.toLowerCase())}</code>`,
    };
  } catch (e) {
    return { text: `⚠️ ${esc((e as Error).message)}\n\n${NEW_FOOD_HELP}` };
  }
}

export function newRecipe(store: Store, user: User, arg: string): Reply {
  const [head, yieldS, servS] = arg.split("|").map((x) => x.trim());
  const idx = (head ?? "").indexOf(":");
  if (idx < 1) return { text: NEW_FOOD_HELP };
  const name = head!.slice(0, idx).trim();
  const ingredients = head!.slice(idx + 1).trim();
  try {
    const { food, parsed } = createRecipeFood(
      { name, ingredients, yieldG: yieldS ? parseFloat(yieldS) : undefined, servings: servS ? parseFloat(servS) : undefined },
      store.customFoods(user.id),
    );
    store.saveCustomFood(user.id, food);
    const lines = [`✅ Retsept <b>${esc(food.name.uz)}</b> saqlandi`, ""];
    for (const i of parsed.items) lines.push(`• ${i.grams} g ${esc(i.food.name.uz)}: ${i.nutrition.kcal} kkal`);
    if (parsed.unknown.length) lines.push(`⚠️ Topilmadi: ${esc(parsed.unknown.join(", "))}`);
    lines.push("", `100 g da <b>${food.per100.kcal} kkal</b> · O ${food.per100.protein} · Y ${food.per100.fat} · U ${food.per100.carbs}`);
    if (food.portions.porsiya) lines.push(`1 porsiya (${food.portions.porsiya} g) = ${Math.round((food.per100.kcal * food.portions.porsiya) / 100)} kkal`);
    if (!yieldS) lines.push("", "<i>Tayyor taomni tortib, og'irligini | dan keyin yozsangiz aniqroq bo'ladi.</i>");
    return { text: lines.join("\n") };
  } catch (e) {
    return { text: `⚠️ ${esc((e as Error).message)}\n\n${NEW_FOOD_HELP}` };
  }
}

export function myFoods(store: Store, user: User): Reply {
  const list = store.customFoods(user.id);
  if (!list.length) return { text: `Hali o'z mahsulotingiz yo'q.\n\n${NEW_FOOD_HELP}` };
  return {
    text: ["<b>Mening mahsulotlarim</b>", "", ...list.map((f, i) => `${i + 1}. ${esc(f.name.uz)}: 100 g da ${f.per100.kcal} kkal${f.recipe ? " (retsept)" : ""}`)].join("\n"),
    buttons: list.slice(0, 20).map((f, i) => [{ text: `🗑 ${f.name.uz}`.slice(0, 60), data: `del:${i}` }]),
  };
}

export function findFood(store: Store, user: User, arg: string): Reply {
  if (!arg.trim()) return { text: "Taom nomini yozing: <code>/taom manti</code>" };
  const found = searchFoods(arg, 3, store.customFoods(user.id));
  if (!found.length) return { text: `"${esc(arg)}" topilmadi.` };
  return { text: found.map(sourceBlock).join("\n\n") };
}

export function toggleReminder(store: Store, user: User): Reply {
  const u = store.updateUser(user.id, { remind: user.remind ? 0 : 1 });
  return { text: u.remind ? "🔔 Eslatmalar yoqildi: 13:00 va 20:30 da." : "🔕 Eslatmalar o'chirildi." };
}

/** Reminder text for a user at a given Tashkent hour, or null if nothing to say. */
export function reminderFor(store: Store, user: User, kind: "lunch" | "evening"): string | null {
  const d = store.day(user.id, tashkentDay());
  if (kind === "lunch") {
    return d.entries.length ? null : "🍽 Nonushta va tushlikda nima yedingiz? Yozib qo'ying, hisoblab beraman.";
  }
  if (!d.entries.length) return "🌙 Bugun hech narsa yozilmadi. Bugun nima yeganingizni yozib qo'ysangiz, hisobot tayyorlab beraman.";
  return dayMessage(d, targetsFor(user), user.weightKg, "Kun yakuni");
}

export { HELP };
