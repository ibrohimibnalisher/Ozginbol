"use client";

import { useT } from "./i18n";
import { useEffect, useMemo, useState } from "react";
import type { FatCategory, Measurements, Profile, Sex } from "@ozginbol/core";
import { FAT_CATEGORY_BOUNDS, FAT_CATEGORY_LABELS, MEASURE_TIPS, RISK_LABELS, bodyComposition, measurementError } from "@ozginbol/core";
import { Ring } from "./Ring";

export interface BodyEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
  bodyFatPct: number;
}

const BAND_COLORS: Record<FatCategory, string> = {
  essential: "var(--protein)",
  athlete: "var(--brand-strong)",
  fitness: "var(--brand)",
  average: "var(--fat)",
  obese: "var(--warn)",
};
const SCALE: Record<Sex, [number, number]> = { male: [2, 40], female: [10, 48] };

type Form = { sex: Sex; age: string; heightCm: string; weightKg: string; neckCm: string; waistCm: string; hipCm: string };

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(day)}.${m}`;
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 300},${66 - ((v - min) / (max - min)) * 60}`);
  return (
    <svg className="spark" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function BodyCalculator({
  profile,
  history,
  onHistory,
  onUseFat,
}: {
  profile: Profile | null;
  history: BodyEntry[];
  onHistory: (h: BodyEntry[]) => void;
  onUseFat: (pct: number) => void;
}) {
  const { tr } = useT();
  const last = history[history.length - 1];
  const [f, setF] = useState<Form>({ sex: "male", age: "28", heightCm: "175", weightKg: "75", neckCm: "", waistCm: "", hipCm: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setF((o) => ({
      ...o,
      sex: profile?.sex ?? o.sex,
      age: profile ? String(profile.age) : o.age,
      heightCm: profile ? String(profile.heightCm) : o.heightCm,
      weightKg: last ? String(last.weightKg) : profile ? String(profile.weightKg) : o.weightKg,
      neckCm: o.neckCm || (last ? String(last.neckCm) : ""),
      waistCm: o.waistCm || (last ? String(last.waistCm) : ""),
      hipCm: o.hipCm || (last?.hipCm ? String(last.hipCm) : ""),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, history.length]);

  const m: Measurements = {
    sex: f.sex,
    age: Number(f.age) || undefined,
    heightCm: Number(f.heightCm),
    weightKg: Number(f.weightKg),
    neckCm: Number(f.neckCm),
    waistCm: Number(f.waistCm),
    hipCm: f.hipCm ? Number(f.hipCm) : undefined,
  };
  const filled = f.neckCm !== "" && f.waistCm !== "" && (f.sex === "male" || f.hipCm !== "");
  const error = filled ? measurementError(m) : null;
  const b = useMemo(() => (filled && !error && m.weightKg > 0 ? bodyComposition(m) : null), [filled, error, JSON.stringify(m)]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const [lo, hi] = SCALE[f.sex];
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`;
  const bands = FAT_CATEGORY_BOUNDS[f.sex].map(([cat, max], i, arr) => {
    const from = i === 0 ? lo : arr[i - 1]![1];
    const to = Math.min(max, hi);
    return { cat, w: ((to - from) / (hi - lo)) * 100 };
  });

  const saveEntry = () => {
    if (!b) return;
    const entry: BodyEntry = { date: today(), weightKg: m.weightKg, neckCm: m.neckCm, waistCm: m.waistCm, hipCm: m.hipCm, bodyFatPct: b.bodyFatPct };
    onHistory([...history.filter((h) => h.date !== entry.date), entry].sort((a, c) => a.date.localeCompare(c.date)).slice(-60));
    setMsg(tr("O'lchov saqlandi"));
    setTimeout(() => setMsg(null), 1800);
  };

  const recent = history.slice(-8).reverse();

  return (
    <div className="split">
      <div className="card">
        <div className="form">
          <label className="full">
            Jins
            <div className="seg" role="radiogroup" aria-label={tr("Jins")}>
              {(["male", "female"] as Sex[]).map((x) => (
                <button type="button" key={x} role="radio" aria-checked={f.sex === x} className={f.sex === x ? "on" : ""} onClick={() => setF({ ...f, sex: x })}>
                  {x === "male" ? tr("Erkak") : tr("Ayol")}
                </button>
              ))}
            </div>
          </label>
          <label>
            {tr("Yosh")}
            <input type="number" inputMode="numeric" value={f.age} onChange={set("age")} />
          </label>
          <label>
            {tr("Bo'y, sm")}
            <input type="number" inputMode="numeric" value={f.heightCm} onChange={set("heightCm")} />
          </label>
          <label>
            {tr("Vazn, kg")}
            <input type="number" inputMode="decimal" step="0.1" value={f.weightKg} onChange={set("weightKg")} />
          </label>
          <label>
            {tr("Bo'yin, sm")}
            <input type="number" inputMode="decimal" step="0.5" value={f.neckCm} onChange={set("neckCm")} placeholder="38" />
          </label>
          <label>
            {tr("Bel, sm")}
            <input type="number" inputMode="decimal" step="0.5" value={f.waistCm} onChange={set("waistCm")} placeholder="85" />
          </label>
          {f.sex === "female" ? (
            <label>
              {tr("Son, sm")}
              <input type="number" inputMode="decimal" step="0.5" value={f.hipCm} onChange={set("hipCm")} placeholder="98" />
            </label>
          ) : (
            <span />
          )}
        </div>
        <div className="panel" style={{ marginTop: 18 }}>
          <ul className="tips">
            {MEASURE_TIPS.filter((t) => t.key !== "hip" || f.sex === "female").map((t) => (
              <li key={t.key}>
                <b>{tr(t.label)}:</b> {tr(t.tip)}
              </li>
            ))}
            <li>{tr("Ertalab, och qoringa, bir xil joyda o'lchang. Haftada bir marta yetarli.")}</li>
          </ul>
        </div>
      </div>

      <div className="card result-card">
        {!filled && <p className="note" style={{ margin: 0 }}>{tr(f.sex === "female" ? "Bo'yin, bel va son aylanasini kiriting: natija shu yerda chiqadi." : "Bo'yin va bel aylanasini kiriting: natija shu yerda chiqadi.")}</p>}
        {error && <p className="warn">{tr(error)}</p>}
        {b && (
          <>
            <div className="big-kcal">
              <Ring value={b.bodyFatPct} max={hi} color={BAND_COLORS[b.category]} size={136} label={`${b.bodyFatPct}%`} sub={tr("yog' foizi")} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{tr(FAT_CATEGORY_LABELS[b.category])}</div>
                <div className="note" style={{ marginTop: 4 }}>
                  {tr("Sog'lom oraliq: {a}-{b}%", { a: b.healthyRange[0], b: b.healthyRange[1] })}
                  {b.bmiEstimatePct !== undefined && <> · {tr("TMI bo'yicha taxmin: {n}%", { n: b.bmiEstimatePct })}</>}
                </div>
              </div>
            </div>

            <div className="scale" aria-label={`${tr("Yog' foizi shkalasi")}, ${b.bodyFatPct}%`}>
              <div className="bands">
                {bands.map((x) => (
                  <i key={x.cat} style={{ width: `${x.w}%`, background: BAND_COLORS[x.cat] }} title={tr(FAT_CATEGORY_LABELS[x.cat])} />
                ))}
              </div>
              <div className="marker" style={{ left: pos(b.bodyFatPct) }} />
              <div className="ticks">
                <span>{lo}%</span>
                <span>{hi}%</span>
              </div>
              <div className="legend">
                {bands.map((x) => (
                  <span key={x.cat} className={x.cat === b.category ? "on" : ""}>
                    <i style={{ background: BAND_COLORS[x.cat] }} />
                    {tr(FAT_CATEGORY_LABELS[x.cat])}
                  </span>
                ))}
              </div>
            </div>

            <div className="kv">
              <div>
                <b>{b.fatMassKg} kg</b>
                <span>{tr("yog' massasi")}</span>
              </div>
              <div>
                <b>{b.leanMassKg} kg</b>
                <span>{tr("yog'siz massa")}</span>
              </div>
              <div>
                <b>{b.waistToHeight.toFixed(2)}</b>
                <span>
                  {tr("bel ÷ bo'y")} <span className={`risk ${b.whtrRisk}`}>{tr(RISK_LABELS[b.whtrRisk])}</span>
                </span>
              </div>
            </div>
            <p className="note" style={{ margin: 0 }}>
              {tr("Bel bo'yicha yurak-qon tomir xavfi")}: <span className={`risk ${b.waistRisk}`}>{tr(RISK_LABELS[b.waistRisk])}</span>
              {b.waistToHip !== undefined && <> · {tr("bel ÷ son")} = {b.waistToHip}</>}
            </p>

            <details className="steps">
              <summary>{tr("Qanday hisoblandi (US Navy usuli)")}</summary>
              <ol>
                {b.steps.map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ol>
              <p className="note">{tr("Lenta usulining xatoligi odatda ±3-4%. Bir xil sharoitda o'lchasangiz, o'zgarish yo'nalishi aniq ko'rinadi.")}</p>
            </details>

            <div className="actions">
              <button className="btn" onClick={saveEntry}>
                {msg ?? tr("O'lchovni saqlash")}
              </button>
              {profile && (
                <button className="btn ghost" onClick={() => onUseFat(b.bodyFatPct)} title={tr("Katch-McArdle formulasi bilan aniqroq me'yor")}>
                  {profile.bodyFatPct === b.bodyFatPct ? tr("Me'yorda ishlatilmoqda ✓") : tr("Kunlik me'yorda ishlatish")}
                </button>
              )}
            </div>
          </>
        )}

        {history.length > 0 && (
          <div>
            <div style={{ fontWeight: 800, margin: "6px 0 4px" }}>{tr("O'lchovlar tarixi")}</div>
            <Sparkline values={history.map((h) => h.bodyFatPct)} />
            <table className="history">
              <thead>
                <tr>
                  <th>{tr("Sana")}</th>
                  <th>{tr("Vazn")}</th>
                  <th>{tr("Bel")}</th>
                  <th>{tr("Bo'yin")}</th>
                  <th>{tr("Yog'")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((h, i) => {
                  const prev = recent[i + 1];
                  const d = prev ? Math.round((h.bodyFatPct - prev.bodyFatPct) * 10) / 10 : 0;
                  return (
                    <tr key={h.date}>
                      <td>{fmtDate(h.date)}</td>
                      <td>{h.weightKg}</td>
                      <td>{h.waistCm}</td>
                      <td>{h.neckCm}</td>
                      <td>
                        <b>{h.bodyFatPct}%</b> {prev && d !== 0 && <span className={`delta ${d < 0 ? "down" : "up"}`}>{d > 0 ? `+${d}` : d}</span>}
                      </td>
                      <td>
                        <button className="link" aria-label={tr("O'chirish")} onClick={() => onHistory(history.filter((x) => x.date !== h.date))}>
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
