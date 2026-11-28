"use client";

import { Fragment, useMemo, useState } from "react";
import type { Food } from "@ozginbol/core";
import { FOODS, formatUnit, searchFoods } from "@ozginbol/core";
import FoodSource from "./FoodSource";

const SOURCE_BADGE: Record<Food["source"], string> = {
  recipe: "retsept",
  usda: "USDA",
  "ru-table": "jadval",
  label: "yorliq",
  user: "siz",
};

export default function FoodTable({ myFoods }: { myFoods: Food[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => (q.trim() ? searchFoods(q, 30, myFoods) : FOODS.filter((f) => f.category === "milliy")), [q, myFoods]);

  return (
    <div className="card">
      <input className="search" placeholder="Qidirish: somsa, manti, un, olma..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Taom qidirish" />
      <div className="table-scroll">
        <table className="foods">
          <thead>
            <tr>
              <th>Taom</th>
              <th className="n">kkal</th>
              <th className="n hide-sm">Oqsil</th>
              <th className="n hide-sm">Yog'</th>
              <th className="n hide-sm">Uglevod</th>
              <th>Porsiya</th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => {
              const g = f.portions[f.defaultUnit] ?? 100;
              return (
                <Fragment key={f.id}>
                  <tr className="clickable" onClick={() => setOpen(open === f.id ? null : f.id)}>
                    <td>
                      {f.name.uz} <span className={`badge ${f.source}`}>{SOURCE_BADGE[f.source]}</span>
                    </td>
                    <td className="n">{f.per100.kcal}</td>
                    <td className="n hide-sm">{f.per100.protein}</td>
                    <td className="n hide-sm">{f.per100.fat}</td>
                    <td className="n hide-sm">{f.per100.carbs}</td>
                    <td>
                      {f.defaultUnit === "g" ? "100 g" : `${formatUnit(f.defaultUnit, 1)} ≈ ${g} ${f.liquid ? "ml" : "g"}, ${Math.round((f.per100.kcal * g) / 100)} kkal`}
                      {f.sizes && (
                        <div className="note">
                          {Object.entries(f.sizes)
                            .map(([k, v]) => `${k === "orta" ? "o'rta" : k} ${v} g`)
                            .join(" · ")}
                        </div>
                      )}
                    </td>
                  </tr>
                  {open === f.id && (
                    <tr>
                      <td colSpan={6}>
                        <FoodSource food={f} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {!q && <p className="note">Hozir milliy taomlar ko'rsatilgan. Boshqa mahsulotlar va masalliqlarni qidiruv orqali toping.</p>}
    </div>
  );
}
