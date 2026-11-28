"use client";

import { useT } from "./i18n";
import { useState } from "react";
import type { Food } from "@ozginbol/core";
import { createCustomFood, createRecipeFood, recipeLines } from "@ozginbol/core";

type Mode = "product" | "recipe";

export default function MyFoods({ foods, onChange }: { foods: Food[]; onChange: (f: Food[]) => void }) {
  const { tr } = useT();
  const [mode, setMode] = useState<Mode>("product");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [basis, setBasis] = useState<"100" | "portion">("100");
  const [vals, setVals] = useState({ kcal: "", protein: "", fat: "", carbs: "", portion: "" });
  const [ingredients, setIngredients] = useState("");
  const [yieldG, setYieldG] = useState("");
  const [servings, setServings] = useState("");

  const n = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));
  const set = (k: keyof typeof vals) => (e: React.ChangeEvent<HTMLInputElement>) => setVals({ ...vals, [k]: e.target.value });

  const preview = (() => {
    if (mode !== "recipe" || !ingredients.trim()) return null;
    try {
      return createRecipeFood({ name: name || tr("Retsept"), ingredients, yieldG: n(yieldG) || undefined, servings: n(servings) || undefined }, foods);
    } catch {
      return null;
    }
  })();

  const add = () => {
    setError("");
    try {
      let food: Food;
      if (mode === "product") {
        const m = { kcal: n(vals.kcal), protein: n(vals.protein) || 0, fat: n(vals.fat) || 0, carbs: n(vals.carbs) || 0 };
        if (!Number.isFinite(m.kcal)) throw new Error(tr("Kaloriyani kiriting"));
        const portion = n(vals.portion);
        food = createCustomFood({
          name,
          ...(basis === "100" ? { per100: m } : { perPortion: m }),
          portionGrams: Number.isFinite(portion) ? portion : undefined,
        });
        if (basis === "portion" && !Number.isFinite(portion)) throw new Error(tr("Porsiya og'irligini kiriting"));
      } else {
        if (!preview) throw new Error(tr("Masalliqlarni yozing, masalan: 500 g un, 1 kg go'sht"));
        food = createRecipeFood({ name, ingredients, yieldG: n(yieldG) || undefined, servings: n(servings) || undefined }, foods).food;
      }
      onChange([...foods.filter((f) => f.name.uz.toLowerCase() !== food.name.uz.toLowerCase()), food]);
      setName("");
      setVals({ kcal: "", protein: "", fat: "", carbs: "", portion: "" });
      setIngredients("");
      setYieldG("");
      setServings("");
    } catch (e) {
      setError(tr((e as Error).message));
    }
  };

  return (
    <div className="card">
      <div className="tabs">
        <button className={mode === "product" ? "on" : ""} onClick={() => setMode("product")}>
          {tr("Mahsulot (yorliqdan)")}
        </button>
        <button className={mode === "recipe" ? "on" : ""} onClick={() => setMode("recipe")}>
          {tr("Retsept (masalliqlardan)")}
        </button>
      </div>

      <div className="form">
        <label className="wide">
          {tr("Nomi")}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={mode === "product" ? tr("Masalan: Agusha tvorog") : tr("Masalan: Onamning oshi")} />
        </label>

        {mode === "product" ? (
          <>
            <label>
              {tr("Qiymat")}
              <select value={basis} onChange={(e) => setBasis(e.target.value as "100" | "portion")}>
                <option value="100">{tr("100 g uchun")}</option>
                <option value="portion">{tr("1 dona / porsiya uchun")}</option>
              </select>
            </label>
            <label>
              {tr("Kaloriya, kkal")}
              <input inputMode="decimal" value={vals.kcal} onChange={set("kcal")} />
            </label>
            <label>
              {tr("Oqsil, g")}
              <input inputMode="decimal" value={vals.protein} onChange={set("protein")} />
            </label>
            <label>
              {tr("Yog', g")}
              <input inputMode="decimal" value={vals.fat} onChange={set("fat")} />
            </label>
            <label>
              {tr("Uglevod, g")}
              <input inputMode="decimal" value={vals.carbs} onChange={set("carbs")} />
            </label>
            <label>
              {tr("1 dona og'irligi, g")}
              <input inputMode="decimal" value={vals.portion} onChange={set("portion")} placeholder={basis === "100" ? tr("ixtiyoriy") : tr("majburiy")} />
            </label>
          </>
        ) : (
          <>
            <label className="full">
              {tr("Masalliqlar")}
              <textarea
                className="meal small"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder={tr("1 kg guruch, 1 kg mol go'shti, 250 g yog', 1 kg sabzi, 300 g piyoz")}
              />
            </label>
            <label>
              {tr("Tayyor taom og'irligi, g")}
              <input inputMode="numeric" value={yieldG} onChange={(e) => setYieldG(e.target.value)} placeholder={tr("tortib ko'ring")} />
            </label>
            <label>
              {tr("Necha porsiya")}
              <input inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} placeholder={tr("ixtiyoriy")} />
            </label>
            {preview && (
              <div className="full source">
                {preview.parsed.items.map((i) => (
                  <div key={i.input}>
                    {i.grams} g {i.food.name.uz}: {i.nutrition.kcal} {tr("kkal")}
                  </div>
                ))}
                {preview.parsed.unknown.length > 0 && <div className="warn">{tr("Topilmadi")}: {preview.parsed.unknown.join(", ")}</div>}
                <b>
                  {tr("100 g da {kcal} kkal", { kcal: preview.food.per100.kcal })}
                  {preview.food.portions.porsiya ? ` · ${tr("1 porsiya {g} g = {kcal} kkal", { g: preview.food.portions.porsiya, kcal: Math.round((preview.food.per100.kcal * preview.food.portions.porsiya) / 100) })}` : ""}
                </b>
                {!yieldG && <div className="note">{tr("Tayyor taomni tarozida tortsangiz, natija aniqroq bo'ladi (guruch suv shimadi, go'sht suv yo'qotadi).")}</div>}
              </div>
            )}
          </>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn" onClick={add} disabled={!name.trim()}>
            {tr("Qo'shish")}
          </button>
          {error && <span className="warn" style={{ marginLeft: 12 }}>{error}</span>}
        </div>
      </div>

      {foods.length > 0 && (
        <ul className="myfoods">
          {foods.map((f) => (
            <li key={f.id}>
              <div>
                <b>{f.name.uz}</b>
                <div className="note">
                  100 g: {f.per100.kcal} {tr("kkal")} · {tr("O")} {f.per100.protein} · {tr("Y")} {f.per100.fat} · {tr("U")} {f.per100.carbs}
                  {f.portions.dona ? ` · ${tr("1 dona {g} g", { g: f.portions.dona })}` : ""}
                  {f.recipe ? ` · ${tr("{n} masalliq", { n: recipeLines(f).length - 1 })}` : ""}
                </div>
              </div>
              <button className="link" onClick={() => onChange(foods.filter((x) => x.id !== f.id))}>
                {tr("O'chirish")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
