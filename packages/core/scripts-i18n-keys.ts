// Collects every Uzbek UI string that goes through the translator. Run: npx tsx scripts-i18n-keys.ts > keys.json
import { readFileSync } from "node:fs";
import * as C from "./src/index";

const root = new URL("../../", import.meta.url).pathname;
const read = (p: string) => readFileSync(root + p, "utf8");
const keys = new Set<string>();
const add = (s: string | undefined) => {
  if (s && /[A-Za-zʻ']/.test(s) && s.trim()) keys.add(s);
};

// 1. Literal keys passed to tr()/L()/t(lang, ...)
const files = [
  "apps/mobile/src/App.tsx", "apps/mobile/src/diary.ts", "apps/mobile/src/reminders.ts",
  ...["AddFood", "Body", "Menu", "MyFoods", "Onboarding", "Photos", "ProfileScreen", "Progress", "Scanner", "Today", "Training"].map((f) => `apps/mobile/src/screens/${f}.tsx`),
  ...["FoodInfo", "TodayExtras"].map((f) => `apps/mobile/src/components/${f}.tsx`),
  ...["BodyCalculator", "Chrome", "FoodSource", "FoodTable", "GoalCalculator", "Home", "MealCalculator", "MenuPlanner", "Micros", "MyFoods", "ThemeToggle"].map((f) => `apps/web/components/${f}.tsx`),
  "apps/bot/src/logic.ts", "apps/bot/src/format.ts", "apps/bot/src/bot.ts",
  "packages/core/src/sources.ts",
];
const lit = /(?:\btr|\bL|\bt\(lang,)\s*\(?\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
for (const f of files) {
  const src = read(f);
  for (const m of src.matchAll(lit)) add(eval(m[1]!) as string);
}

// 2. Constant tables in the apps that are translated at render time
const blocks: [string, string, string][] = [
  ["apps/mobile/src/diary.ts", "export const MEALS", "];"],
  ["apps/mobile/src/App.tsx", "const TABS", "];"],
  ["apps/mobile/src/screens/Onboarding.tsx", "export const ACTIVITY", "/** Profile form"],
  ["apps/mobile/src/screens/Photos.tsx", "const POSES", "];"],
  ["apps/mobile/src/screens/Progress.tsx", "const WD", ";"],
  ["apps/mobile/src/screens/ProfileScreen.tsx", "const BMI", ";"],
  ["apps/mobile/src/reminders.ts", "const DAILY", "];"],
  ["apps/mobile/src/screens/AddFood.tsx", "const POPULAR", ";"],
  ["apps/web/components/GoalCalculator.tsx", "const ACTIVITY_LABELS", "const DEFAULT"],
  ["apps/web/components/FoodTable.tsx", "const SOURCE_BADGE", "};"],
  ["apps/web/components/MealCalculator.tsx", "const EXAMPLES", "];"],
  ["apps/bot/src/logic.ts", "export const GOAL_LABELS", ";"],
  ["apps/bot/src/logic.ts", "const NEW_FOOD_HELP_LINES", "];"],
  ["apps/bot/src/format.ts", "const HELP_LINES", "];"],
  ["apps/bot/src/format.ts", "const WEEKDAYS", ";"],
];
for (const [f, start, end] of blocks) {
  const src = read(f);
  const i = src.indexOf(start);
  if (i < 0) throw new Error(`${f}: ${start}`);
  const body = src.slice(i + start.length, src.indexOf(end, i + start.length));
  for (const m of body.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
    const s = JSON.parse(`"${m[1]}"`) as string;
    if (/^[a-z_]+$/.test(s) && !["sushka", "ozish", "siz", "jadval", "yorliq", "retsept", "normal", "semizlik"].includes(s)) continue; // ids
    if (s.startsWith("<code>")) continue;
    add(s);
  }
}

// 3. Core data shown to people
for (const g of Object.values(C.GOAL_INFO)) add(g.label);
Object.values(C.FAT_CATEGORY_LABELS).forEach(add);
Object.values(C.RISK_LABELS).forEach(add);
Object.values(C.MENU_MEAL_LABELS).forEach(add);
Object.values(C.SIZE_LABELS).forEach(add);
for (const t of C.MEASURE_TIPS) (add(t.label), add(t.tip));
for (const p of C.FASTING_PLANS) add(p.hint);
for (const s of C.FASTING_STAGES) (add(s.title), add(s.text));
add(C.FASTING_WARNING);
for (const a of C.achievements({ streak: 0, bestStreak: 0, daysLogged: 0, entries: 0, waterGoalDays: 0, proteinGoalDays: 0, calorieGoalDays: 0, measurements: 0, weighIns: 0, weightChangeKg: 0, fastsCompleted: 0, workouts: 0, customFoods: 0 })) (add(a.title), add(a.text));
for (const goal of ["cut", "lose", "maintain", "gain"] as const) {
  const p = C.trainingPlan(goal);
  add(p.title), add(p.summary), p.rules.forEach(add);
  for (const d of p.week) (add(d.day), add(d.focus), d.exercises.forEach(add));
}
for (const e of C.EXERCISE_LIBRARY) (add(e.name), add(e.muscles), add(e.level), e.steps.forEach(add), e.mistakes.forEach(add));
for (const f of C.FOODS) {
  if (f.recipe) add(f.recipe.note);
  if (f.source === "ru-table" && f.ref) add(f.ref);
}
for (const k of C.MICRO_KEYS) C.MICRO_INFO[k].sources.forEach(add);

// 4. Plain and templated messages built inside core
for (const f of ["goals.ts", "body.ts", "score.ts", "custom.ts", "fasting.ts", "parser.ts"]) {
  const src = read(`packages/core/src/${f}`);
  for (const m of src.matchAll(/(?:push|return|Error)\(\s*"((?:[^"\\]|\\.)*)"/g)) add(JSON.parse(`"${m[1]}"`));
  for (const m of src.matchAll(/return "((?:[^"\\]|\\.)*)";/g)) add(JSON.parse(`"${m[1]}"`));
  for (const m of src.matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
    const raw = m[1]!;
    if (!raw.includes("${") || !/[a-z]{4,}/i.test(raw.replace(/\$\{[^}]*\}/g, ""))) continue;
    let i = 0;
    add(raw.replace(/\$\{(?:[^{}]|\{[^}]*\})*\}/g, () => `{${i++}}`));
  }
}
add("{0} soat {1} daq");
add("{0} daq");

console.log(JSON.stringify([...keys].sort(), null, 1));
