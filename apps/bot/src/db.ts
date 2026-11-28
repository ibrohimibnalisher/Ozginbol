import { DatabaseSync } from "node:sqlite";
import type { Activity, Food, Goal, Macros, ParsedItem, Profile, Sex, UnitKey } from "@ozginbol/core";

export type Step = "sex" | "age" | "height" | "weight" | "activity" | "goal" | "rate" | "target" | "done";

export interface User {
  id: number;
  name: string;
  step: Step;
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: Activity | null;
  goal: Goal | null;
  rateKgPerWeek: number | null;
  targetWeightKg: number | null;
  remind: number;
}

export interface Entry extends Macros {
  id: number;
  userId: number;
  day: string;
  at: number;
  input: string;
  foodId: string;
  quantity: number;
  unit: UnitKey;
  grams: number;
}

export interface DaySummary {
  day: string;
  food: Macros;
  burned: number;
  waterMl: number;
  entries: Entry[];
}

/** Calendar day in Tashkent (UTC+5, no DST). */
export function tashkentDay(ts = Date.now()): string {
  return new Date(ts + 5 * 3600_000).toISOString().slice(0, 10);
}

export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function profileOf(u: User): Profile | null {
  if (!u.sex || !u.age || !u.heightCm || !u.weightKg || !u.activity || !u.goal) return null;
  return {
    sex: u.sex, age: u.age, heightCm: u.heightCm, weightKg: u.weightKg, activity: u.activity, goal: u.goal,
    ...(u.rateKgPerWeek !== null ? { rateKgPerWeek: u.rateKgPerWeek } : {}),
    ...(u.targetWeightKg !== null ? { targetWeightKg: u.targetWeightKg } : {}),
  };
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '', step TEXT NOT NULL DEFAULT 'sex',
  sex TEXT, age INTEGER, height_cm REAL, weight_kg REAL, activity TEXT, goal TEXT,
  remind INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, day TEXT NOT NULL, at INTEGER NOT NULL,
  input TEXT NOT NULL, food_id TEXT NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL, grams REAL NOT NULL,
  kcal REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, carbs REAL NOT NULL, fiber REAL NOT NULL DEFAULT 0,
  meal TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS entries_user_day ON entries(user_id, day);
CREATE TABLE IF NOT EXISTS water (user_id INTEGER NOT NULL, day TEXT NOT NULL, ml INTEGER NOT NULL, PRIMARY KEY (user_id, day));
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, day TEXT NOT NULL,
  exercise_id TEXT NOT NULL, minutes REAL NOT NULL, kcal REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_foods (user_id INTEGER NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, json TEXT NOT NULL, PRIMARY KEY (user_id, id));
CREATE TABLE IF NOT EXISTS weights (user_id INTEGER NOT NULL, day TEXT NOT NULL, kg REAL NOT NULL, PRIMARY KEY (user_id, day));
`;

type Row = Record<string, unknown>;

function toUser(r: Row): User {
  return {
    id: Number(r.id),
    name: String(r.name ?? ""),
    step: r.step as Step,
    sex: (r.sex as Sex) ?? null,
    age: (r.age as number) ?? null,
    heightCm: (r.height_cm as number) ?? null,
    weightKg: (r.weight_kg as number) ?? null,
    activity: (r.activity as Activity) ?? null,
    goal: (r.goal as Goal) ?? null,
    rateKgPerWeek: (r.rate as number) ?? null,
    targetWeightKg: (r.target_weight as number) ?? null,
    remind: Number(r.remind ?? 1),
  };
}

function toEntry(r: Row): Entry {
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    day: String(r.day),
    at: Number(r.at),
    input: String(r.input),
    foodId: String(r.food_id),
    quantity: Number(r.quantity),
    unit: r.unit as UnitKey,
    grams: Number(r.grams),
    kcal: Number(r.kcal),
    protein: Number(r.protein),
    fat: Number(r.fat),
    carbs: Number(r.carbs),
    fiber: Number(r.fiber),
  };
}

const COLS: Record<string, string> = {
  name: "name", step: "step", sex: "sex", age: "age", heightCm: "height_cm", weightKg: "weight_kg",
  activity: "activity", goal: "goal", remind: "remind", rateKgPerWeek: "rate", targetWeightKg: "target_weight",
};

/**
 * Storage for the bot. SQLite keeps the first version dependency-free;
 * the methods map one-to-one to a future PostgreSQL implementation.
 */
export class Store {
  private db: DatabaseSync;

  constructor(path = ":memory:") {
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
    // Columns added after the first release.
    for (const col of ["rate REAL", "target_weight REAL"]) {
      try {
        this.db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
      } catch {
        /* already there */
      }
    }
  }

  customFoods(userId: number): Food[] {
    return (this.db.prepare("SELECT json FROM custom_foods WHERE user_id = ? ORDER BY rowid").all(userId) as Row[]).map((r) => JSON.parse(String(r.json)) as Food);
  }

  saveCustomFood(userId: number, food: Food): void {
    // Same name replaces the old one.
    this.db.prepare("DELETE FROM custom_foods WHERE user_id = ? AND lower(name) = lower(?)").run(userId, food.name.uz);
    this.db.prepare("INSERT INTO custom_foods (user_id, id, name, json) VALUES (?, ?, ?, ?)").run(userId, food.id, food.name.uz, JSON.stringify(food));
  }

  deleteCustomFood(userId: number, id: string): boolean {
    return Number(this.db.prepare("DELETE FROM custom_foods WHERE user_id = ? AND id = ?").run(userId, id).changes) > 0;
  }

  getUser(id: number): User | null {
    const r = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Row | undefined;
    return r ? toUser(r) : null;
  }

  ensureUser(id: number, name: string): User {
    this.db
      .prepare("INSERT INTO users (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name")
      .run(id, name, Date.now());
    return this.getUser(id)!;
  }

  updateUser(id: number, patch: Partial<Omit<User, "id">>): User {
    const keys = Object.keys(patch).filter((k) => COLS[k]);
    if (keys.length) {
      const sql = `UPDATE users SET ${keys.map((k) => `${COLS[k]} = ?`).join(", ")} WHERE id = ?`;
      const values = keys.map((k) => (patch as Record<string, unknown>)[k] as string | number | null);
      this.db.prepare(sql).run(...values, id);
    }
    return this.getUser(id)!;
  }

  usersForReminder(): User[] {
    return (this.db.prepare("SELECT * FROM users WHERE remind = 1 AND step = 'done'").all() as Row[]).map(toUser);
  }

  addEntries(userId: number, items: ParsedItem[], day = tashkentDay()): number[] {
    const st = this.db.prepare(
      `INSERT INTO entries (user_id, day, at, input, food_id, quantity, unit, grams, kcal, protein, fat, carbs, fiber, meal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const now = Date.now();
    const meal = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    return items.map((i) => {
      const n = i.nutrition;
      const res = st.run(userId, day, now, i.input, i.food.id, i.quantity, i.unit, i.grams, n.kcal, n.protein, n.fat, n.carbs, n.fiber ?? 0, meal);
      return Number(res.lastInsertRowid);
    });
  }

  deleteEntries(userId: number, ids: number[]): number {
    if (!ids.length) return 0;
    const res = this.db
      .prepare(`DELETE FROM entries WHERE user_id = ? AND id IN (${ids.map(() => "?").join(",")})`)
      .run(userId, ...ids);
    return Number(res.changes);
  }

  /** Remove the most recent meal (all items added in one message). */
  undoLast(userId: number): Entry[] {
    const last = this.db.prepare("SELECT meal FROM entries WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(userId) as Row | undefined;
    if (!last) return [];
    const rows = (this.db.prepare("SELECT * FROM entries WHERE user_id = ? AND meal = ?").all(userId, String(last.meal)) as Row[]).map(toEntry);
    this.deleteEntries(userId, rows.map((r) => r.id));
    return rows;
  }

  addWater(userId: number, ml: number, day = tashkentDay()): number {
    this.db
      .prepare("INSERT INTO water (user_id, day, ml) VALUES (?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET ml = max(0, ml + excluded.ml)")
      .run(userId, day, ml);
    return Number((this.db.prepare("SELECT ml FROM water WHERE user_id = ? AND day = ?").get(userId, day) as Row).ml);
  }

  addWorkout(userId: number, exerciseId: string, minutes: number, kcal: number, day = tashkentDay()): void {
    this.db.prepare("INSERT INTO workouts (user_id, day, exercise_id, minutes, kcal) VALUES (?, ?, ?, ?, ?)").run(userId, day, exerciseId, minutes, kcal);
  }

  setWeight(userId: number, kg: number, day = tashkentDay()): void {
    this.db
      .prepare("INSERT INTO weights (user_id, day, kg) VALUES (?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET kg = excluded.kg")
      .run(userId, day, kg);
    this.updateUser(userId, { weightKg: kg });
  }

  weights(userId: number, limit = 30): { day: string; kg: number }[] {
    return (this.db.prepare("SELECT day, kg FROM weights WHERE user_id = ? ORDER BY day DESC LIMIT ?").all(userId, limit) as Row[])
      .map((r) => ({ day: String(r.day), kg: Number(r.kg) }))
      .reverse();
  }

  day(userId: number, day = tashkentDay()): DaySummary {
    const entries = (this.db.prepare("SELECT * FROM entries WHERE user_id = ? AND day = ? ORDER BY id").all(userId, day) as Row[]).map(toEntry);
    const food = entries.reduce(
      (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, fat: a.fat + e.fat, carbs: a.carbs + e.carbs, fiber: (a.fiber ?? 0) + (e.fiber ?? 0) }),
      { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 } as Macros,
    );
    const burned = Number((this.db.prepare("SELECT COALESCE(SUM(kcal), 0) AS k FROM workouts WHERE user_id = ? AND day = ?").get(userId, day) as Row).k);
    const w = this.db.prepare("SELECT ml FROM water WHERE user_id = ? AND day = ?").get(userId, day) as Row | undefined;
    return { day, food, burned, waterMl: w ? Number(w.ml) : 0, entries };
  }

  /** Last `days` days ending today (oldest first). */
  week(userId: number, days = 7, today = tashkentDay()): DaySummary[] {
    return Array.from({ length: days }, (_, i) => this.day(userId, shiftDay(today, i - days + 1)));
  }

  close(): void {
    this.db.close();
  }
}
