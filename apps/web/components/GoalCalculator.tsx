"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity, Goal, Profile, Sex, Targets } from "@ozginbol/core";
import { GOAL_INFO, computeTargets } from "@ozginbol/core";

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Kam harakat (ofis, 5 ming qadamdan kam)",
  light: "Haftada 1-3 mashg'ulot",
  moderate: "Haftada 3-5 mashg'ulot",
  active: "Har kuni mashg'ulot",
  very_active: "Og'ir jismoniy ish + mashg'ulot",
};
const GOAL_HINT: Record<Goal, string> = {
  cut: "Mushakni saqlab yog'ni quritish. Oqsil yuqori (2.2 g/kg).",
  lose: "Oddiy ozish. Defitsit 25% dan oshmaydi.",
  maintain: "Vazn joyida qoladi.",
  gain: "Mushak massasi. Kichik ortiqcha kaloriya, ortiqcha yog'siz.",
};
const BMI_LABELS: Record<Targets["bmiCategory"], string> = {
  underweight: "vazn kam",
  normal: "normal",
  overweight: "ortiqcha vazn",
  obese: "semizlik",
};

const DEFAULT: Profile = { sex: "male", age: 28, heightCm: 175, weightKg: 75, activity: "light", goal: "lose", rateKgPerWeek: 0.5 };

function addWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
  return `${d.getDate()}-${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function GoalCalculator({ initial, onSave }: { initial: Profile | null; targets: Targets | null; onSave: (p: Profile) => void }) {
  const [p, setP] = useState<Profile>(initial ?? DEFAULT);
  useEffect(() => {
    if (initial) setP(initial);
  }, [initial]);

  const num = (k: "age" | "heightCm" | "weightKg" | "targetWeightKg" | "bodyFatPct") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP({ ...p, [k]: e.target.value === "" ? undefined : Number(e.target.value) });

  const valid = p.age >= 14 && p.age <= 100 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 300;
  // Live: results update as you type, "Saqlash" remembers them for the calculator above.
  const t = useMemo(() => (valid ? computeTargets(p) : null), [p, valid]);
  const info = GOAL_INFO[p.goal];

  return (
    <div className="card">
      <div className="modes" role="radiogroup" aria-label="Maqsad">
        {(Object.keys(GOAL_INFO) as Goal[]).map((g) => (
          <button
            key={g}
            role="radio"
            aria-checked={p.goal === g}
            className={`mode ${p.goal === g ? "on" : ""}`}
            onClick={() => setP({ ...p, goal: g, rateKgPerWeek: GOAL_INFO[g].defaultRate })}
          >
            <b>{GOAL_INFO[g].label}</b>
            <span>{GOAL_HINT[g]}</span>
          </button>
        ))}
      </div>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave(p);
        }}
      >
        <label>
          Jins
          <select value={p.sex} onChange={(e) => setP({ ...p, sex: e.target.value as Sex })}>
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
          </select>
        </label>
        <label>
          Yosh
          <input type="number" inputMode="numeric" value={p.age} onChange={num("age")} min={14} max={100} />
        </label>
        <label>
          Bo'y, sm
          <input type="number" inputMode="numeric" value={p.heightCm} onChange={num("heightCm")} min={120} max={230} />
        </label>
        <label>
          Vazn, kg
          <input type="number" inputMode="decimal" value={p.weightKg} onChange={num("weightKg")} min={30} max={300} step="0.1" />
        </label>
        <label className="wide">
          Faollik
          <select value={p.activity} onChange={(e) => setP({ ...p, activity: e.target.value as Activity })}>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {p.goal !== "maintain" && (
          <label>
            Tezlik
            <select value={p.rateKgPerWeek ?? info.defaultRate} onChange={(e) => setP({ ...p, rateKgPerWeek: Number(e.target.value) })}>
              {info.rates.map((r) => (
                <option key={r} value={r}>
                  {r} kg / hafta
                </option>
              ))}
            </select>
          </label>
        )}
        {p.goal !== "maintain" && (
          <label>
            Maqsad vazn, kg
            <input type="number" inputMode="decimal" value={p.targetWeightKg ?? ""} onChange={num("targetWeightKg")} placeholder="ixtiyoriy" step="0.1" />
          </label>
        )}
        <label>
          Yog' foizi, %
          <input type="number" inputMode="decimal" value={p.bodyFatPct ?? ""} onChange={num("bodyFatPct")} placeholder="bilsangiz" step="0.5" />
        </label>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn" type="submit" disabled={!valid}>
            Saqlash
          </button>
          <span className="note" style={{ marginLeft: 12 }}>
            Natija yozgan zahoti yangilanadi. Saqlasangiz, kalkulyator shu me'yor bilan solishtiradi.
          </span>
        </div>
      </form>

      {t && (
        <>
          <div className="targets">
            <div className="stat kcal">
              <div className="v">{t.calories}</div>
              <div className="l">kkal / kun</div>
            </div>
            <div className="stat p">
              <div className="v">{t.protein} g</div>
              <div className="l">oqsil · {Math.round(((t.protein * 4) / t.calories) * 100)}%</div>
            </div>
            <div className="stat f">
              <div className="v">{t.fat} g</div>
              <div className="l">yog' · {Math.round(((t.fat * 9) / t.calories) * 100)}%</div>
            </div>
            <div className="stat c">
              <div className="v">{t.carbs} g</div>
              <div className="l">uglevod · {Math.round(((t.carbs * 4) / t.calories) * 100)}%</div>
            </div>
          </div>

          {t.weeksToTarget !== null && p.targetWeightKg && (
            <p className="eta">
              🎯 {p.targetWeightKg} kg ga taxminan <b>{t.weeksToTarget} haftada</b> yetasiz ({addWeeks(t.weeksToTarget)}).
            </p>
          )}
          {t.warnings.map((w) => (
            <p key={w} className="warn">
              ⚠️ {w}
            </p>
          ))}

          <details className="steps" open>
            <summary>Qanday hisoblandi</summary>
            <ol>
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="note">
              TMI {t.bmi} ({BMI_LABELS[t.bmiCategory]}). Bo'yingiz uchun sog'lom vazn: {t.healthyWeight[0]}-{t.healthyWeight[1]} kg. Suv: kuniga{" "}
              {(t.waterMl / 1000).toFixed(1)} l. Kletchatka: {t.fiber} g.
            </p>
          </details>
        </>
      )}
    </div>
  );
}
