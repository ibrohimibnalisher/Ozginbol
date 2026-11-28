"use client";

import { useMemo, useState } from "react";
import type { Food, SizeKey, Targets } from "@ozginbol/core";
import { SIZE_LABELS, formatUnit, minutesToBurn, parseMeal, scaleMacros, searchFoods, sumMacros } from "@ozginbol/core";
import FoodSource from "./FoodSource";

const EXAMPLES = [
  "2 ta somsa va 1 piyola choy",
  "1 porsiya osh, achchiq-chuchuk, 2 bo'lak non",
  "1 katta kosa lag'mon",
  "5 ta manti, 1 stakan qatiq",
  "2 ta tuxum, 1 bo'lak non, 1 banan",
  "lavash va 1 banka kola",
];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function MealCalculator({ targets, weightKg, myFoods }: { targets: Targets | null; weightKg: number; myFoods: Food[] }) {
  const [text, setText] = useState("");
  // grams overrides keyed by item index + food id, so edits survive re-parsing
  const [grams, setGrams] = useState<Record<string, { g: number; size?: SizeKey }>>({});
  const [open, setOpen] = useState<string | null>(null);

  const parsed = useMemo(() => parseMeal(text, { extraFoods: myFoods }), [text, myFoods]);

  const items = parsed.items.map((it, i) => {
    const k = `${i}:${it.food.id}`;
    const o = grams[k];
    const baseUnitG = it.grams / it.quantity;
    if (o === undefined) return { ...it, k, baseUnitG };
    const unitG = o.size && it.food.sizes?.[o.size] ? it.food.sizes[o.size]! : baseUnitG;
    return { ...it, k, baseUnitG, size: o.size ?? it.size, grams: o.g, quantity: Math.round((o.g / unitG) * 10) / 10, nutrition: scaleMacros(it.food.per100, o.g) };
  });
  const total = sumMacros(items.map((i) => i.nutrition));
  const setG = (k: string, g: number, size?: SizeKey) => setGrams((o) => ({ ...o, [k]: { g: Math.max(1, Math.round(g)), size: size ?? o[k]?.size } }));
  const pct = (v: number, t: number) => Math.min(100, Math.round((v / t) * 100));

  return (
    <div className="card">
      <textarea
        className="meal"
        placeholder="Masalan: 2 ta somsa, 1 kosa lag'mon va 1 piyola choy"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setGrams({});
        }}
        aria-label="Yegan taomlaringiz"
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
            {items.map((it) => {
              const unitG = it.grams / it.quantity;
              const count = Math.max(1, Math.round(it.quantity));
              const sizes = it.food.sizes && it.unit === it.food.defaultUnit ? it.food.sizes : null;
              return (
                <li className="item" key={it.k}>
                  <div>
                    <div className="name">{it.food.name.uz}</div>
                    <div className="meta">
                      {it.unit === "g" || it.unit === "ml" ? "" : `${formatUnit(it.unit, it.quantity)}${it.size ? ` (${SIZE_LABELS[it.size]})` : ""} · `}O {fmt(it.nutrition.protein)} · Y{" "}
                      {fmt(it.nutrition.fat)} · U {fmt(it.nutrition.carbs)}
                    </div>
                    {it.confidence < 0.9 && <div className="low-conf">"{it.input}" deb yozdingiz, {it.food.name.uz} deb tushundik</div>}
                    <div className="item-tools">
                      <label className="grams">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.grams}
                          min={1}
                          onChange={(e) => setG(it.k, Number(e.target.value) || 1)}
                          aria-label={`${it.food.name.uz}, gramm`}
                        />
                        {it.food.liquid ? "ml" : "g"}
                      </label>
                      {it.unit !== "g" && it.unit !== "ml" && (
                        <>
                          <button className="mini" aria-label="Kamaytirish" onClick={() => setG(it.k, it.grams - unitG * 0.5)}>
                            −
                          </button>
                          <button className="mini" aria-label="Ko'paytirish" onClick={() => setG(it.k, it.grams + unitG * 0.5)}>
                            +
                          </button>
                        </>
                      )}
                      {sizes &&
                        (Object.keys(sizes) as SizeKey[]).map((s) => (
                          <button
                            key={s}
                            className={`mini size ${Math.round(sizes[s]! * count) === it.grams ? "on" : ""}`}
                            onClick={() => setG(it.k, sizes[s]! * count, s)}
                            title={`${sizes[s]} g`}
                          >
                            {SIZE_LABELS[s]}
                          </button>
                        ))}
                      <button className="link" onClick={() => setOpen(open === it.k ? null : it.k)}>
                        {open === it.k ? "Yopish" : "Manba"}
                      </button>
                    </div>
                    {open === it.k && <FoodSource food={it.food} />}
                  </div>
                  <div className="kcal">{it.nutrition.kcal} kkal</div>
                </li>
              );
            })}
          </ul>

          {total.kcal > 0 && (
            <div className="burn">
              Shuncha kaloriyani yoqish uchun taxminan {minutesToBurn("walk", weightKg, total.kcal)} daqiqa piyoda yurish yoki{" "}
              {minutesToBurn("run", weightKg, total.kcal)} daqiqa yugurish kerak.
            </div>
          )}
        </>
      )}

      {parsed.unknown.length > 0 && (
        <div className="unknown">
          {parsed.unknown.map((u) => {
            const sugg = searchFoods(u, 3, myFoods);
            return (
              <div key={u}>
                <b>"{u}"</b> bazada topilmadi.
                {sugg.length > 0 && <> Balki: {sugg.map((s) => s.name.uz).join(", ")}?</>}{" "}
                <a href="#mening">O'zingiz qo'shing</a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
