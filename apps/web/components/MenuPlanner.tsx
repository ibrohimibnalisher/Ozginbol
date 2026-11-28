"use client";

import { useMemo, useState } from "react";
import type { Profile, Targets } from "@ozginbol/core";
import { MENU_MEAL_LABELS, generateMenu } from "@ozginbol/core";
import { MacroBar, Ring } from "./Ring";
import { useT } from "./i18n";

export default function MenuPlanner({ targets, profile }: { targets: Targets | null; profile: Profile | null }) {
  const { tr, lang } = useT();
  const [seed, setSeed] = useState(1);
  const calories = targets?.calories ?? 2000;
  const protein = targets?.protein ?? 120;
  const menu = useMemo(() => generateMenu({ calories, protein, goal: profile?.goal }, seed), [calories, protein, profile?.goal, seed]);

  return (
    <div className="card">
      <div className="summary" style={{ marginTop: 0 }}>
        <Ring value={Math.min(menu.total.kcal, calories)} max={calories} label={String(menu.total.kcal)} sub={`/ ${calories} ${tr("kkal")}`} />
        <div className="macros">
          <MacroBar name={tr("Oqsil")} cls="c-p" value={Math.round(menu.total.protein)} target={targets?.protein} />
          <MacroBar name={tr("Yog'")} cls="c-f" value={Math.round(menu.total.fat)} target={targets?.fat} />
          <MacroBar name={tr("Uglevod")} cls="c-c" value={Math.round(menu.total.carbs)} target={targets?.carbs} />
        </div>
      </div>
      {!targets && <p className="note">{tr("Kunlik me'yorni saqlasangiz, menyu sizning kaloriya va oqsilingizga moslanadi. Hozir 2000 kkal uchun.")}</p>}
      <div className="menu-grid">
        {menu.meals.map((m) => (
          <div className="menu-meal" key={m.meal}>
            <div className="menu-head">
              <b>{tr(MENU_MEAL_LABELS[m.meal])}</b>
              <span>{m.total.kcal} {tr("kkal")}</span>
            </div>
            <ul>
              {m.items.map((i) => (
                <li key={i.food.id}>
                  <span>{i.food.name[lang]}</span>
                  <span className="num">
                    {i.grams} {i.food.liquid ? "ml" : "g"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="note" style={{ marginTop: 6 }}>
              {tr("O")} {Math.round(m.total.protein)} · {tr("Y")} {Math.round(m.total.fat)} · {tr("U")} {Math.round(m.total.carbs)} g
            </div>
          </div>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>
          {tr("Boshqa variant")}
        </button>
        <span className="note" style={{ margin: 0 }}>
          {tr("O'zbek taomlaridan, maqsadga qarab oqsilga ustunlik berib tuziladi. Porsiyalar me'yorga moslanadi.")}
        </span>
      </div>
    </div>
  );
}
