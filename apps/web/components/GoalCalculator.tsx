"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity, Goal, Profile, Sex, Targets } from "@ozginbol/core";
import { GOAL_INFO, computeTargets, monthDay, type Lang } from "@ozginbol/core";
import { useT } from "./i18n";
import { Dumbbell, Flame, Scale, TrendDown } from "./Icons";
import { MacroBar, Ring } from "./Ring";

const GOAL_ICON: Record<Goal, () => React.JSX.Element> = { cut: Flame, lose: TrendDown, maintain: Scale, gain: Dumbbell };

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

function addWeeks(weeks: number, lang: Lang): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return `${monthDay(d.getDate(), d.getMonth() + 1, lang)} ${d.getFullYear()}`;
}

export default function GoalCalculator({ initial, onSave }: { initial: Profile | null; targets: Targets | null; onSave: (p: Profile) => void }) {
  const { tr, lang } = useT();
  const [p, setP] = useState<Profile>(initial ?? DEFAULT);
  const [saved, setSaved] = useState(false);
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
      <div className="modes" role="radiogroup" aria-label={tr("Maqsad")}>
        {(Object.keys(GOAL_INFO) as Goal[]).map((g) => (
          <button
            key={g}
            role="radio"
            aria-checked={p.goal === g}
            className={`mode ${p.goal === g ? "on" : ""}`}
            onClick={() => setP({ ...p, goal: g, rateKgPerWeek: GOAL_INFO[g].defaultRate })}
          >
            <span className="ic">{GOAL_ICON[g]()}</span>
            <b>{tr(GOAL_INFO[g].label)}</b>
            <span>{tr(GOAL_HINT[g])}</span>
          </button>
        ))}
      </div>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave(p);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }}
      >
        <label>
          {tr("Jins")}
          <div className="seg" role="radiogroup" aria-label={tr("Jins")}>
            {(["male", "female"] as Sex[]).map((x) => (
              <button type="button" key={x} role="radio" aria-checked={p.sex === x} className={p.sex === x ? "on" : ""} onClick={() => setP({ ...p, sex: x })}>
                {x === "male" ? tr("Erkak") : tr("Ayol")}
              </button>
            ))}
          </div>
        </label>
        <label>
          {tr("Yosh")}
          <input type="number" inputMode="numeric" value={p.age} onChange={num("age")} min={14} max={100} />
        </label>
        <label>
          {tr("Bo'y, sm")}
          <input type="number" inputMode="numeric" value={p.heightCm} onChange={num("heightCm")} min={120} max={230} />
        </label>
        <label>
          {tr("Vazn, kg")}
          <input type="number" inputMode="decimal" value={p.weightKg} onChange={num("weightKg")} min={30} max={300} step="0.1" />
        </label>
        <label className="wide">
          {tr("Faollik")}
          <select value={p.activity} onChange={(e) => setP({ ...p, activity: e.target.value as Activity })}>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {tr(v)}
              </option>
            ))}
          </select>
        </label>
        {p.goal !== "maintain" && (
          <label>
            {tr("Tezlik")}
            <select value={p.rateKgPerWeek ?? info.defaultRate} onChange={(e) => setP({ ...p, rateKgPerWeek: Number(e.target.value) })}>
              {info.rates.map((r) => (
                <option key={r} value={r}>
                  {r} {tr("kg / hafta")}
                </option>
              ))}
            </select>
          </label>
        )}
        {p.goal !== "maintain" && (
          <label>
            {tr("Maqsad vazn, kg")}
            <input type="number" inputMode="decimal" value={p.targetWeightKg ?? ""} onChange={num("targetWeightKg")} placeholder={tr("ixtiyoriy")} step="0.1" />
          </label>
        )}
        <label>
          {tr("Yog' foizi, %")}
          <input type="number" inputMode="decimal" value={p.bodyFatPct ?? ""} onChange={num("bodyFatPct")} placeholder={tr("bilsangiz")} step="0.5" />
        </label>
        <div className="full actions">
          <button className="btn" type="submit" disabled={!valid}>
            {saved ? tr("Saqlandi ✓") : tr("Saqlash")}
          </button>
          <span className="note" style={{ margin: 0 }}>
            {tr("Natija yozgan zahoti yangilanadi. Saqlasangiz, kalkulyator shu me'yor bilan solishtiradi.")}
          </span>
        </div>
      </form>

      {t && (
        <div className="result-card" style={{ marginTop: 22 }}>
          <div className="summary" style={{ marginTop: 0 }}>
            <Ring value={t.calories} max={t.calories} size={148} label={String(t.calories)} sub={tr("kkal / kun")} />
            <div className="macros">
              <MacroBar name={`${tr("Oqsil")} · ${Math.round(((t.protein * 4) / t.calories) * 100)}%`} cls="c-p" value={t.protein} />
              <MacroBar name={`${tr("Yog'")} · ${Math.round(((t.fat * 9) / t.calories) * 100)}%`} cls="c-f" value={t.fat} />
              <MacroBar name={`${tr("Uglevod")} · ${Math.round(((t.carbs * 4) / t.calories) * 100)}%`} cls="c-c" value={t.carbs} />
            </div>
          </div>
          <div className="kv">
            <div>
              <b>{t.bmr}</b>
              <span>{tr("tinch holatda, kkal")}</span>
            </div>
            <div>
              <b>{t.tdee}</b>
              <span>{tr("faollik bilan sarf, kkal")}</span>
            </div>
            <div>
              <b>
                {t.dailyDelta > 0 ? "+" : ""}
                {t.dailyDelta}
              </b>
              <span>{tr("kunlik farq, kkal")}</span>
            </div>
          </div>

          {t.weeksToTarget !== null && p.targetWeightKg && (
            <p className="eta">
              🎯 {tr("{kg} kg ga taxminan {w} haftada yetasiz ({date}).", { kg: p.targetWeightKg, w: t.weeksToTarget, date: addWeeks(t.weeksToTarget, lang) })}
            </p>
          )}
          {t.warnings.map((w) => (
            <p key={w} className="warn">
              ⚠️ {tr(w)}
            </p>
          ))}

          <details className="steps" open>
            <summary>{tr("Qanday hisoblandi")}</summary>
            <ol>
              {t.steps.map((s) => (
                <li key={s}>{tr(s)}</li>
              ))}
            </ol>
            <p className="note">
              {tr("TMI {bmi} ({cat}). Bo'yingiz uchun sog'lom vazn: {a}-{b} kg. Suv: kuniga {w} l. Kletchatka: {f} g.", {
                bmi: t.bmi,
                cat: tr(BMI_LABELS[t.bmiCategory]),
                a: t.healthyWeight[0],
                b: t.healthyWeight[1],
                w: (t.waterMl / 1000).toFixed(1),
                f: t.fiber,
              })}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
