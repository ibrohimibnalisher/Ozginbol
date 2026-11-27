"use client";

import { useMemo, useState } from "react";
import type { Targets } from "@ozginbol/core";
import { formatUnit, gramsFor, minutesToBurn, parseMeal, scaleMacros, searchFoods, sumMacros } from "@ozginbol/core";

const EXAMPLES = [
  "2 ta somsa va 1 piyola choy",
  "1 porsiya osh, achchiq-chuchuk, 2 bo'lak non",
  "1 kosa lag'mon",
  "5 ta manti, 1 stakan qatiq",
  "2 ta tuxum, 1 bo'lak non, 1 banan",
  "lavash va 1 banka kola",
];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function MealCalculator({ targets, weightKg }: { targets: Targets | null; weightKg: number }) {
  const [text, setText] = useState("");
  // quantity overrides keyed by item index + food id, so +/- survives re-parsing
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const parsed = useMemo(() => parseMeal(text), [text]);

  const items = parsed.items.map((it, i) => {
    const k = `${i}:${it.food.id}`;
    const qty = overrides[k] ?? it.quantity;
    if (qty === it.quantity) return { ...it, k };
    const { grams } = gramsFor(it.food, qty, it.unit);
    return { ...it, k, quantity: qty, grams: Math.round(grams), nutrition: scaleMacros(it.food.per100, grams) };
  });
  const total = sumMacros(items.map((i) => i.nutrition));

  const step = (unit: string) => (unit === "g" || unit === "ml" ? 50 : 0.5);
  const change = (k: string, unit: string, current: number, dir: 1 | -1) => {
    const next = Math.max(step(unit), Math.round((current + dir * step(unit)) * 10) / 10);
    setOverrides((o) => ({ ...o, [k]: next }));
  };

  const pct = (v: number, t: number) => Math.min(100, Math.round((v / t) * 100));

  return (
    <div className="card">
      <textarea
        className="meal"
        placeholder="Masalan: 2 ta somsa, 1 kosa lag'mon va 1 piyola choy"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOverrides({});
        }}
        aria-label="Yegan taomlaringiz"
        autoFocus
      />
      {!text && (
        <div className="chips">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip" onClick={() => setText(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="totals">
            <div className="stat kcal">
              <div className="v">{total.kcal}</div>
              <div className="l">kkal{targets ? ` · kunlik me'yorning ${pct(total.kcal, targets.calories)}%` : ""}</div>
              {targets && (
                <div className={`bar ${total.kcal > targets.calories ? "over" : ""}`}>
                  <i style={{ width: `${pct(total.kcal, targets.calories)}%` }} />
                </div>
              )}
            </div>
            <div className="stat p">
              <div className="v">{fmt(total.protein)}</div>
              <div className="l">oqsil, g{targets ? ` / ${targets.protein}` : ""}</div>
            </div>
            <div className="stat f">
              <div className="v">{fmt(total.fat)}</div>
              <div className="l">yog', g{targets ? ` / ${targets.fat}` : ""}</div>
            </div>
            <div className="stat c">
              <div className="v">{fmt(total.carbs)}</div>
              <div className="l">uglevod, g{targets ? ` / ${targets.carbs}` : ""}</div>
            </div>
          </div>

          <ul className="items">
            {items.map((it) => (
              <li className="item" key={it.k}>
                <div>
                  <div className="name">{it.food.name.uz}</div>
                  <div className="meta">
                    {it.unit === "g" || it.unit === "ml" ? "" : `${formatUnit(it.unit, it.quantity)} · `}
                    {it.grams} {it.food.liquid ? "ml" : "g"} · O {fmt(it.nutrition.protein)} · Y {fmt(it.nutrition.fat)} · U{" "}
                    {fmt(it.nutrition.carbs)}
                  </div>
                  {it.confidence < 0.9 && (
                    <div className="low-conf">"{it.input}" deb yozdingiz, {it.food.name.uz} deb tushundik</div>
                  )}
                </div>
                <div>
                  <div className="kcal">{it.nutrition.kcal} kkal</div>
                  <div className="qty">
                    <button aria-label="Kamaytirish" onClick={() => change(it.k, it.unit, it.quantity, -1)}>
                      −
                    </button>
                    <button aria-label="Ko'paytirish" onClick={() => change(it.k, it.unit, it.quantity, 1)}>
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {total.kcal > 0 && (
            <div className="burn">
              Shuncha kaloriyani yoqish uchun taxminan {minutesToBurn("walk", weightKg, total.kcal)} daqiqa piyoda yurish
              yoki {minutesToBurn("run", weightKg, total.kcal)} daqiqa yugurish kerak.
            </div>
          )}
        </>
      )}

      {parsed.unknown.length > 0 && (
        <div className="unknown">
          {parsed.unknown.map((u) => {
            const sugg = searchFoods(u, 3);
            return (
              <div key={u}>
                <b>"{u}"</b> bazada topilmadi.
                {sugg.length > 0 && <> Balki: {sugg.map((s) => s.name.uz).join(", ")}?</>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
