import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { formatUnit, getFood } from "@ozginbol/core";
import { Card, Icon, IconTile, MacroBar, Muted, Ring, Row, type IconName } from "../components/ui";
import { MEALS, MEAL_SHARE, dayKey, shiftDay, streak, summarize, targetsOf, tips, type MealType } from "../diary";
import { FastingCard, MenuCta, ScoreCard, StepsCard } from "../components/TodayExtras";
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

export default function Today({ day, setDay, onAdd, onMenu }: { day: string; setDay: (d: string) => void; onAdd: (meal: MealType) => void; onMenu: () => void }) {
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

  const yesterday = summarize(state, shiftDay(day, -1));
  const MEAL_ICON: Record<MealType, IconName> = { breakfast: "sun", lunch: "bowl", dinner: "moon", snack: "apple" };
  const waterGoal = tg?.waterMl ?? 2000;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
      <Row style={{ justifyContent: "space-between", paddingTop: 4 }}>
        <Pressable onPress={() => setDay(shiftDay(day, -1))} hitSlop={12} accessibilityLabel="Oldingi kun" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.card, alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevronL" color={t.muted} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>{dayTitle(day)}</Text>
          {st > 1 && (
            <Row style={{ gap: 4 }}>
              <Icon name="flame" size={14} color={t.warn} />
              <Text style={{ color: t.muted, fontSize: 13, fontWeight: "600" }}>{st} kun ketma-ket</Text>
            </Row>
          )}
        </View>
        <Pressable
          onPress={() => !isToday && setDay(shiftDay(day, 1))}
          hitSlop={12}
          accessibilityLabel="Keyingi kun"
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.card, alignItems: "center", justifyContent: "center", opacity: isToday ? 0.4 : 1 }}
        >
          <Icon name="chevronR" color={t.muted} />
        </Pressable>
      </Row>

      <View style={{ backgroundColor: t.hero, borderRadius: 28, padding: 20, overflow: "hidden" }}>
        <View style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: t.heroAccent, opacity: 0.07, top: -120, right: -80 }} />
        <Row style={{ gap: 18 }}>
          <Ring value={sum.food.kcal} max={budget} size={150} stroke={14} color={t.heroAccent} track="rgba(255,255,255,0.12)">
            <Text style={{ color: left >= 0 ? t.heroText : "#ffb38a", fontSize: 34, fontWeight: "800", letterSpacing: -1 }}>{Math.abs(left)}</Text>
            <Text style={{ color: t.heroMuted, fontSize: 12, fontWeight: "600" }}>{left >= 0 ? "kkal qoldi" : "kkal ortiqcha"}</Text>
          </Ring>
          <View style={{ flex: 1, gap: 12 }}>
            {[
              ["Me'yor", tg?.calories ?? "—"],
              ["Yeyildi", sum.food.kcal],
              ["Yoqildi", Math.round(sum.burned)],
            ].map(([l, v]) => (
              <View key={l as string}>
                <Text style={{ color: t.heroMuted, fontSize: 12, fontWeight: "700" }}>{l}</Text>
                <Text style={{ color: t.heroText, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}>
                  {v}
                  <Text style={{ fontSize: 12, color: t.heroMuted, fontWeight: "600" }}> kkal</Text>
                </Text>
              </View>
            ))}
          </View>
        </Row>
      </View>

      {tg && (
        <Card>
          <Row style={{ gap: 14 }}>
            <MacroBar label="Oqsil" value={sum.food.protein} max={tg.protein} color={t.protein} />
            <MacroBar label="Yog'" value={sum.food.fat} max={tg.fat} color={t.fat} />
            <MacroBar label="Uglevod" value={sum.food.carbs} max={tg.carbs} color={t.carbs} />
          </Row>
        </Card>
      )}

      <ScoreCard day={day} isToday={isToday} />

      {advice.map((a) => (
        <Row key={a} style={{ backgroundColor: t.accentSoft, borderRadius: 18, padding: 14, gap: 12, alignItems: "flex-start" }}>
          <Icon name="bulb" size={20} color={t.accentStrong} />
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 20, flex: 1 }}>{a}</Text>
        </Row>
      ))}

      {MEALS.map((m) => {
        const items = sum.byMeal[m.id];
        const kcal = items.reduce((a, e) => a + e.kcal, 0);
        return (
          <Card key={m.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Row style={{ gap: 12 }}>
                <IconTile>
                  <Icon name={MEAL_ICON[m.id]} size={20} color={t.accentStrong} />
                </IconTile>
                <View>
                  <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>{m.label}</Text>
                  <Muted style={{ fontSize: 13 }}>
                    {Math.round(kcal)} / {Math.round((tg?.calories ?? 2000) * MEAL_SHARE[m.id])} kkal
                  </Muted>
                </View>
              </Row>
              <Pressable
                onPress={() => onAdd(m.id)}
                accessibilityLabel={`${m.label}ga qo'shish`}
                style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: t.accent, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}
              >
                <Icon name="plus" size={20} color={t.accentInk} stroke={2.6} />
              </Pressable>
            </Row>
            {items.length === 0 && yesterday.byMeal[m.id].length > 0 && (
              <Pressable
                onPress={() => dispatch({ type: "copyMeal", fromDay: shiftDay(day, -1), toDay: day, meal: m.id })}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: t.card2 }}
              >
                <Icon name="copy" size={16} color={t.accentStrong} />
                <Text style={{ color: t.text, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  Kechagidek: {yesterday.byMeal[m.id].map((e) => e.name).join(", ")}
                </Text>
                <Text style={{ color: t.muted, fontWeight: "700" }}>{Math.round(yesterday.byMeal[m.id].reduce((a, e) => a + e.kcal, 0))}</Text>
              </Pressable>
            )}
            {items.map((e) => (
              <Pressable key={e.id} onPress={() => setSelected(selected === e.id ? null : e.id)}>
                <Row style={{ justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.border, marginTop: 12 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: t.text, fontSize: 15, fontWeight: "700" }}>{e.name}</Text>
                    <Muted style={{ fontSize: 13 }}>
                      {e.unit === "g" || e.unit === "ml" ? `${e.grams} ${e.unit}` : `${formatUnit(e.unit, e.quantity)} · ${e.grams} ${getFood(e.foodId)?.liquid ? "ml" : "g"}`} · O {Math.round(e.protein)} · Y{" "}
                      {Math.round(e.fat)} · U {Math.round(e.carbs)}
                    </Muted>
                  </View>
                  {selected === e.id ? (
                    <Pressable onPress={() => dispatch({ type: "removeEntry", id: e.id })} style={{ backgroundColor: t.warnSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Text style={{ color: t.warn, fontWeight: "800" }}>O'chirish</Text>
                    </Pressable>
                  ) : (
                    <Text style={{ color: t.text, fontWeight: "800", fontSize: 16 }}>{Math.round(e.kcal)}</Text>
                  )}
                </Row>
              </Pressable>
            ))}
            {items.length > 1 && (
              <Pressable
                onPress={() => dispatch({ type: "saveMeal", name: `${m.label}: ${items[0]!.name}`, text: items.map((e) => e.input).join(", ") })}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
                hitSlop={6}
              >
                <Icon name="star" size={15} color={state.savedMeals.some((x) => x.text === items.map((e) => e.input).join(", ")) ? t.fat : t.faint} />
                <Text style={{ color: t.muted, fontSize: 13, fontWeight: "700" }}>
                  {state.savedMeals.some((x) => x.text === items.map((e) => e.input).join(", ")) ? "Sevimlilarda" : "Sevimli ovqatga saqlash"}
                </Text>
              </Pressable>
            )}
          </Card>
        );
      })}

      <StepsCard day={day} isToday={isToday} />
      {isToday && <FastingCard />}
      {isToday && <MenuCta onMenu={onMenu} />}

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: 12 }}>
            <IconTile bg={t.dark ? "#0c2a3a" : "#e0f2fe"}>
              <Icon name="drop" size={20} color={t.water} />
            </IconTile>
            <View>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Suv</Text>
              <Muted style={{ fontSize: 13 }}>
                {(sum.waterMl / 1000).toFixed(2)} l / {(waterGoal / 1000).toFixed(1)} l
              </Muted>
            </View>
          </Row>
          <Row style={{ gap: 8 }}>
            <Pressable
              onPress={() => dispatch({ type: "water", day, deltaMl: -250 })}
              accessibilityLabel="Bir stakan kamaytirish"
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.card2, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: t.text, fontSize: 20, fontWeight: "700", lineHeight: 22 }}>−</Text>
            </Pressable>
            <Pressable onPress={() => dispatch({ type: "water", day, deltaMl: 250 })} style={{ backgroundColor: t.water, borderRadius: 19, paddingHorizontal: 14, height: 38, justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>+250 ml</Text>
            </Pressable>
          </Row>
        </Row>
        <Row style={{ marginTop: 14, gap: 4 }}>
          {Array.from({ length: Math.ceil(waterGoal / 250) }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < sum.waterMl / 250 ? t.water : t.card2 }} />
          ))}
        </Row>
      </Card>
    </ScrollView>
  );
}
