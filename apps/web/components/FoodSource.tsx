"use client";

import type { Food } from "@ozginbol/core";
import { recipeLines, sourceText } from "@ozginbol/core";
import { useT } from "./i18n";
import { FoodMicros } from "./Micros";

/** Where the numbers come from: shown under any food. */
export default function FoodSource({ food }: { food: Food }) {
  const { tr, lang } = useT();
  const lines = recipeLines(food, lang);
  return (
    <div className="source">
      <div>
        <b>{tr("Manba")}:</b> {sourceText(food, lang)}
      </div>
      {lines.length > 0 && (
        <>
          <div className="recipe-note">{tr(food.recipe!.note)}</div>
          <ul>
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </>
      )}
      <div className="per100">
        {tr("100 g: {kcal} kkal · oqsil {p} g · yog' {f} g · uglevod {c} g", { kcal: food.per100.kcal, p: food.per100.protein, f: food.per100.fat, c: food.per100.carbs })}
        {food.per100.fiber ? ` · ${tr("kletchatka")} ${food.per100.fiber} g` : ""}
      </div>
      {food.micros && <FoodMicros micros={food.micros} />}
    </div>
  );
}
