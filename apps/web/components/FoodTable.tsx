"use client";

import { useMemo, useState } from "react";
import { FOODS, formatUnit, searchFoods } from "@ozginbol/core";

export default function FoodTable() {
  const [q, setQ] = useState("");
  const list = useMemo(() => (q.trim() ? searchFoods(q, 30) : FOODS.filter((f) => f.category === "milliy")), [q]);

  return (
    <div className="card">
      <input
        className="search"
        placeholder="Qidirish: somsa, manti, olma..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Taom qidirish"
      />
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
                <tr key={f.id}>
                  <td>{f.name.uz}</td>
                  <td className="n">{f.per100.kcal}</td>
                  <td className="n hide-sm">{f.per100.protein}</td>
                  <td className="n hide-sm">{f.per100.fat}</td>
                  <td className="n hide-sm">{f.per100.carbs}</td>
                  <td>
                    {formatUnit(f.defaultUnit, 1)} ≈ {g} {f.liquid ? "ml" : "g"}, {Math.round((f.per100.kcal * g) / 100)} kkal
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!q && <p className="note">Hozir milliy taomlar ko'rsatilgan. Boshqa mahsulotlarni qidiruv orqali toping.</p>}
    </div>
  );
}
