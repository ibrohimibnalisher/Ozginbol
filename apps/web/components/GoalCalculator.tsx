"use client";

import { useEffect, useState } from "react";
import type { Activity, Goal, Profile, Sex, Targets } from "@ozginbol/core";

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Kam harakat (ofis)",
  light: "Haftada 1-3 mashg'ulot",
  moderate: "Haftada 3-5 mashg'ulot",
  active: "Har kuni mashg'ulot",
  very_active: "Og'ir jismoniy ish",
};
const GOAL_LABELS: Record<Goal, string> = { lose: "Ozish", maintain: "Vaznni saqlash", gain: "Massa yig'ish" };
const BMI_LABELS: Record<Targets["bmiCategory"], string> = {
  underweight: "vazn kam",
  normal: "normal",
  overweight: "ortiqcha vazn",
  obese: "semizlik",
};

const DEFAULT: Profile = { sex: "male", age: 28, heightCm: 175, weightKg: 75, activity: "light", goal: "lose" };

export default function GoalCalculator({
  initial,
  targets,
  onSave,
}: {
  initial: Profile | null;
  targets: Targets | null;
  onSave: (p: Profile) => void;
}) {
  const [p, setP] = useState<Profile>(initial ?? DEFAULT);
  useEffect(() => {
    if (initial) setP(initial);
  }, [initial]);

  const num = (k: "age" | "heightCm" | "weightKg") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP({ ...p, [k]: Number(e.target.value) });

  const valid = p.age >= 14 && p.age <= 100 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 300;

  return (
    <div className="card">
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
        <label>
          Faollik
          <select value={p.activity} onChange={(e) => setP({ ...p, activity: e.target.value as Activity })}>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Maqsad
          <select value={p.goal} onChange={(e) => setP({ ...p, goal: e.target.value as Goal })}>
            {Object.entries(GOAL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn" type="submit" disabled={!valid}>
            Hisoblash
          </button>
        </div>
      </form>

      {targets && (
        <>
          <div className="targets">
            <div className="stat kcal">
              <div className="v">{targets.calories}</div>
              <div className="l">kkal / kun</div>
            </div>
            <div className="stat p">
              <div className="v">{targets.protein} g</div>
              <div className="l">oqsil</div>
            </div>
            <div className="stat f">
              <div className="v">{targets.fat} g</div>
              <div className="l">yog'</div>
            </div>
            <div className="stat c">
              <div className="v">{targets.carbs} g</div>
              <div className="l">uglevod</div>
            </div>
          </div>
          <p className="note">
            Tana massasi indeksi {targets.bmi} ({BMI_LABELS[targets.bmiCategory]}). Tinch holatda {targets.bmr} kkal, faollik
            bilan {targets.tdee} kkal sarflaysiz.{" "}
            {targets.weeklyChangeKg !== 0 &&
              `Shu me'yorda haftasiga taxminan ${Math.abs(targets.weeklyChangeKg)} kg ${
                targets.weeklyChangeKg < 0 ? "ozasiz" : "qo'shasiz"
              }.`}{" "}
            Kuniga {(targets.waterMl / 1000).toFixed(1)} litr suv iching. Yuqoridagi kalkulyator endi natijani shu me'yor bilan
            solishtiradi.
          </p>
        </>
      )}
    </div>
  );
}
