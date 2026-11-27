import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { formatUnit, getFood } from "@ozginbol/core";
import { Card, MacroBar, Muted, Ring, Row } from "../components/ui";
import { MEALS, dayKey, shiftDay, streak, summarize, targetsOf, tips, type MealType } from "../diary";
import { useDiary } from "../store";
import { useTheme } from "../theme";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

function dayTitle(day: string): string {
  const today = dayKey();
  if (day === today) return "Bugun";
  if (day === shiftDay(today, -1)) return "Kecha";
  const [, m, d] = day.split("-").map(Number) as [number, number, number];
  return `${d}-${MONTHS[m - 1]}`;
}

export default function Today({ day, setDay, onAdd }: { day: string; setDay: (d: string) => void; onAdd: (meal: MealType) => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [selected, setSelected] = useState<string | null>(null);
  const sum = summarize(state, day);
  const tg = targetsOf(state);
  const budget = (tg?.calories ?? 2000) + Math.round(sum.burned);
  const left = budget - sum.food.kcal;
  const st = streak(state);
  const advice = tips(sum, tg);
  const isToday = day === dayKey();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Pressable onPress={() => setDay(shiftDay(day, -1))} hitSlop={12} accessibilityLabel="Oldingi kun">
          <Text style={{ color: t.muted, fontSize: 26 }}>‹</Text>
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: "800" }}>{dayTitle(day)}</Text>
          {st > 1 && <Text style={{ color: t.muted, fontSize: 13 }}>🔥 {st} kun ketma-ket</Text>}
        </View>
        <Pressable onPress={() => !isToday && setDay(shiftDay(day, 1))} hitSlop={12} accessibilityLabel="Keyingi kun">
          <Text style={{ color: isToday ? t.border : t.muted, fontSize: 26 }}>›</Text>
        </Pressable>
      </Row>

      <Card style={{ alignItems: "center" }}>
        <Ring value={sum.food.kcal} max={budget}>
          <Text style={{ color: left >= 0 ? t.text : t.warn, fontSize: 38, fontWeight: "800" }}>{Math.abs(left)}</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>{left >= 0 ? "kkal qoldi" : "kkal ortiqcha"}</Text>
        </Ring>
        <Row style={{ marginTop: 12, gap: 24 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 17 }}>{sum.food.kcal}</Text>
            <Muted>yeyildi</Muted>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 17 }}>{tg?.calories ?? "—"}</Text>
            <Muted>me'yor</Muted>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 17 }}>{Math.round(sum.burned)}</Text>
            <Muted>yoqildi</Muted>
          </View>
        </Row>
        {tg && (
          <Row style={{ marginTop: 16, gap: 14, alignSelf: "stretch" }}>
            <MacroBar label="Oqsil" value={sum.food.protein} max={tg.protein} color={t.protein} />
            <MacroBar label="Yog'" value={sum.food.fat} max={tg.fat} color={t.fat} />
            <MacroBar label="Uglevod" value={sum.food.carbs} max={tg.carbs} color={t.carbs} />
          </Row>
        )}
      </Card>

      {advice.map((a) => (
        <Card key={a} style={{ backgroundColor: t.accentSoft, borderColor: t.accentSoft, paddingVertical: 12 }}>
          <Text style={{ color: t.text, fontSize: 14 }}>💡 {a}</Text>
        </Card>
      ))}

      {MEALS.map((m) => {
        const items = sum.byMeal[m.id];
        const kcal = items.reduce((a, e) => a + e.kcal, 0);
        return (
          <Card key={m.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "700" }}>
                {m.icon} {m.label}
              </Text>
              <Row style={{ gap: 12 }}>
                {kcal > 0 && <Text style={{ color: t.muted, fontWeight: "600" }}>{Math.round(kcal)} kkal</Text>}
                <Pressable
                  onPress={() => onAdd(m.id)}
                  accessibilityLabel={`${m.label}ga qo'shish`}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: t.accent, fontSize: 22, fontWeight: "700", lineHeight: 24 }}>+</Text>
                </Pressable>
              </Row>
            </Row>
            {items.map((e) => (
              <Pressable key={e.id} onPress={() => setSelected(selected === e.id ? null : e.id)}>
                <Row style={{ justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, marginTop: 10 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: t.text, fontSize: 15, fontWeight: "600" }}>{e.name}</Text>
                    <Muted>
                      {e.unit === "g" || e.unit === "ml" ? `${e.grams} ${e.unit}` : `${formatUnit(e.unit, e.quantity)} · ${e.grams} ${getFood(e.foodId)?.liquid ? "ml" : "g"}`} · O {Math.round(e.protein)} · Y{" "}
                      {Math.round(e.fat)} · U {Math.round(e.carbs)}
                    </Muted>
                  </View>
                  {selected === e.id ? (
                    <Pressable onPress={() => dispatch({ type: "removeEntry", id: e.id })} style={{ backgroundColor: t.warn, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ color: "#fff", fontWeight: "700" }}>O'chirish</Text>
                    </Pressable>
                  ) : (
                    <Text style={{ color: t.text, fontWeight: "700" }}>{Math.round(e.kcal)}</Text>
                  )}
                </Row>
              </Pressable>
            ))}
          </Card>
        );
      })}

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: "700" }}>💧 Suv</Text>
            <Muted>
              {(sum.waterMl / 1000).toFixed(2)} l{tg ? ` / ${(tg.waterMl / 1000).toFixed(1)} l` : ""}
            </Muted>
          </View>
          <Row style={{ gap: 8 }}>
            {[-250, 250].map((d) => (
              <Pressable
                key={d}
                onPress={() => dispatch({ type: "water", day, deltaMl: d })}
                style={{ backgroundColor: d > 0 ? t.water : t.card2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <Text style={{ color: d > 0 ? "#fff" : t.text, fontWeight: "700" }}>{d > 0 ? "+1 stakan" : "−"}</Text>
              </Pressable>
            ))}
          </Row>
        </Row>
        {tg && (
          <Row style={{ marginTop: 12, flexWrap: "wrap", gap: 6 }}>
            {Array.from({ length: Math.ceil(tg.waterMl / 250) }, (_, i) => (
              <Text key={i} style={{ fontSize: 20, opacity: i < sum.waterMl / 250 ? 1 : 0.25 }}>
                🥛
              </Text>
            ))}
          </Row>
        )}
      </Card>
    </ScrollView>
  );
}
