"use client";

import type { Food, Micros, Profile } from "@ozginbol/core";
import { MICRO_INFO, MICRO_KEYS, formatMicro, microGaps, microReport, microTargets, sumMicros } from "@ozginbol/core";
import { useT } from "./i18n";

/** Per-100 g vitamins and minerals of one food. */
export function FoodMicros({ micros }: { micros: Micros }) {
  const { tr, lang } = useT();
  return (
    <div className="micros">
      <div className="micros-head">
        <b>{tr("Vitamin va minerallar, 100 g da")}</b>
      </div>
      <div className="micro-grid">
        {MICRO_KEYS.map((k) => (
          <div className="micro" key={k}>
            <div className="mn">{MICRO_INFO[k].name[lang]}</div>
            <div className="mv">{formatMicro(k, micros[k])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Vitamins and minerals of a meal, as % of the person's daily reference intake. */
export function MealMicros({ items, myFoods, profile }: { items: { foodId: string; grams: number; kcal: number }[]; myFoods: Food[]; profile: Profile | null }) {
  const { tr, lang } = useT();
  if (!items.length) return null;
  const { micros, coverage } = sumMicros(items, myFoods);
  const rows = microReport(micros, microTargets(profile ?? { sex: "male", age: 30 })).filter((r) => r.kind !== "info");
  const gaps = microGaps(rows);
  return (
    <div className="micros">
      <div className="micros-head">
        <b>{tr("Vitamin va minerallar")}</b>
        <span className="note" style={{ margin: 0 }}>
          {profile ? tr("Kunlik me'yordan, foizda") : tr("Kunlik me'yordan, foizda (o'rtacha erkak uchun; me'yoringizni saqlang)")}
          {coverage < 0.95 ? ` · ${tr("{n}% ovqat hisobga olindi", { n: Math.round(coverage * 100) })}` : ""}
        </span>
      </div>
      <div className="micro-grid">
        {rows.map((r) => (
          <div className={`micro ${r.status}`} key={r.key} title={MICRO_INFO[r.key].why[lang]}>
            <div className="mn">{MICRO_INFO[r.key].name[lang]}</div>
            <div className="mv">
              {formatMicro(r.key, r.amount)} <span className="note" style={{ margin: 0 }}>· {r.pct}%{r.kind === "max" ? ` ${tr("chegaradan")}` : ""}</span>
            </div>
            <div className="bar">
              <i style={{ width: `${Math.min(100, r.pct ?? 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {gaps.length > 0 && (
        <div className="micro-hint">
          <b>{tr("Kam bo'lyapti")}:</b>{" "}
          {gaps.map((g) => `${MICRO_INFO[g.key].name[lang]} (${MICRO_INFO[g.key].sources.map((x) => tr(x)).join(", ")})`).join("; ")}
        </div>
      )}
    </div>
  );
}
