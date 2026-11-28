"use client";

import type { Food } from "@ozginbol/core";
import { recipeLines, sourceText } from "@ozginbol/core";

/** Where the numbers come from: shown under any food. */
export default function FoodSource({ food }: { food: Food }) {
  const lines = recipeLines(food);
  return (
    <div className="source">
      <div>
        <b>Manba:</b> {sourceText(food)}
      </div>
      {lines.length > 0 && (
        <>
          <div className="recipe-note">{food.recipe!.note}</div>
          <ul>
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </>
      )}
      <div className="per100">
        100 g: {food.per100.kcal} kkal · oqsil {food.per100.protein} g · yog' {food.per100.fat} g · uglevod {food.per100.carbs} g
      </div>
    </div>
  );
}
