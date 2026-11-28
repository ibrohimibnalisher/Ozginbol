"use client";

import { useMemo, useState } from "react";
import type { Food, Profile, SizeKey, Targets } from "@ozginbol/core";
import { SIZE_LABELS, formatUnit, minutesToBurn, parseMeal, scaleMacros, searchFoods, sumMacros } from "@ozginbol/core";
import FoodSource from "./FoodSource";
import { Flame } from "./Icons";
import { MacroBar, Ring } from "./Ring";
import { useT } from "./i18n";
import { MealMicros } from "./Micros";

const EXAMPLES = [
  "2 ta somsa va 1 piyola choy",
  "1 porsiya osh, achchiq-chuchuk, 2 bo'lak non",
  "1 katta kosa lag'mon",
  "5 ta manti, 1 stakan qatiq",
  "2 ta tuxum, 1 bo'lak non, 1 banan",
  "lavash va 1 banka kola",
];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function MealCalculator({ targets, profile, myFoods }: { targets: Targets | null; profile: Profile | null; myFoods: Food[] }) {
  const { tr, lang } = useT();
  const weightKg = profile?.weightKg ?? 70;
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

  return (
    <div className="card calc-card">
      <textarea
        className="meal"
        placeholder={tr("Masalan: 2 ta somsa, 1 kosa lag'mon va 1 piyola choy")}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setGrams({});
        }}
        aria-label={tr("Yegan taomlaringiz")}
      />
      {!text && (
        <div className="chips">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip" onClick={() => setText(tr(ex))}>
              {tr(ex)}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="summary">
            <Ring
              value={total.kcal}
              max={targets?.calories ?? null}
              label={String(total.kcal)}
              sub={targets ? `/ ${targets.calories} ${tr("kkal")}` : tr("kkal")}
            />
            <div className="macros">
              <MacroBar name={tr("Oqsil")} cls="c-p" value={total.protein} target={targets?.protein} />
              <MacroBar name={tr("Yog'")} cls="c-f" value={total.fat} target={targets?.fat} />
              <MacroBar name={tr("Uglevod")} cls="c-c" value={total.carbs} target={targets?.carbs} />
            </div>
          </div>

          <ul className="items">
            {items.map((it) => {
              const unitG = it.grams / it.quantity;
              const count = Math.max(1, Math.round(it.quantity));
              const sizes = it.food.sizes && it.unit === it.food.defaultUnit ? it.food.sizes : null;
              return (
                <li className="item" key={it.k}>
                  <div className="avatar" aria-hidden="true">
                    {it.food.name[lang].charAt(0)}
                  </div>
                  <div>
                    <div className="name">{it.food.name[lang]}</div>
                    <div className="meta">
                      {it.unit === "g" || it.unit === "ml" ? "" : `${formatUnit(it.unit, it.quantity, lang)}${it.size ? ` (${tr(SIZE_LABELS[it.size])})` : ""} · `}
                      {tr("O")} {fmt(it.nutrition.protein)} · {tr("Y")} {fmt(it.nutrition.fat)} · {tr("U")} {fmt(it.nutrition.carbs)}
                    </div>
                    {it.confidence < 0.9 && <div className="low-conf">{tr('"{input}" deb yozdingiz, {name} deb tushundik', { input: it.input, name: it.food.name[lang] })}</div>}
                    <div className="item-tools">
                      <label className="grams">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.grams}
                          min={1}
                          onChange={(e) => setG(it.k, Number(e.target.value) || 1)}
                          aria-label={`${it.food.name[lang]}, ${tr("gramm")}`}
                        />
                        {it.food.liquid ? "ml" : "g"}
                      </label>
                      {it.unit !== "g" && it.unit !== "ml" && (
                        <>
                          <button className="mini" aria-label={tr("Kamaytirish")} onClick={() => setG(it.k, it.grams - unitG * 0.5)}>
                            −
                          </button>
                          <button className="mini" aria-label={tr("Ko'paytirish")} onClick={() => setG(it.k, it.grams + unitG * 0.5)}>
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
                            {tr(SIZE_LABELS[s])}
                          </button>
                        ))}
                      <button className="link" onClick={() => setOpen(open === it.k ? null : it.k)}>
                        {open === it.k ? tr("Yopish") : tr("Manba")}
                      </button>
                    </div>
                    {open === it.k && <FoodSource food={it.food} />}
                  </div>
                  <div className="kcal">
                    {it.nutrition.kcal}
                    <small>{tr("kkal")}</small>
                  </div>
                </li>
              );
            })}
          </ul>

          {total.kcal > 0 && (
            <div className="burn">
              <Flame />
              {tr("Shuncha kaloriyani yoqish uchun taxminan {walk} daqiqa piyoda yurish yoki {run} daqiqa yugurish kerak.", {
                walk: minutesToBurn("walk", weightKg, total.kcal),
                run: minutesToBurn("run", weightKg, total.kcal),
              })}
            </div>
          )}
          <MealMicros items={items.map((i) => ({ foodId: i.food.id, grams: i.grams, kcal: i.nutrition.kcal }))} myFoods={myFoods} profile={profile} />
        </>
      )}

      {parsed.unknown.length > 0 && (
        <div className="unknown">
          {parsed.unknown.map((u) => {
            const sugg = searchFoods(u, 3, myFoods);
            return (
              <div key={u}>
                <b>"{u}"</b> {tr("bazada topilmadi.")}
                {sugg.length > 0 && <> {tr("Balki")}: {sugg.map((s) => s.name[lang]).join(", ")}?</>}{" "}
                <a href="#mening">{tr("O'zingiz qo'shing")}</a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
