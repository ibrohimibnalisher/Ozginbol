import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MENU_MEAL_LABELS, generateMenu } from "@ozginbol/core";
import { Button, Card, Eyebrow, H1, Icon, MacroBar, Muted, Row } from "../components/ui";
import { targetsOf, type MealType } from "../diary";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";

export default function Menu({ day, onClose }: { day: string; onClose: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr, lang } = useT();
  const tg = targetsOf(state)!;
  const [seed, setSeed] = useState(() => Math.floor(Date.now() / 86400000));
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const menu = useMemo(() => generateMenu({ calories: tg.calories, protein: tg.protein, goal: state.profile?.goal }, seed), [tg.calories, tg.protein, state.profile?.goal, seed]);

  const add = (meal: MealType) => {
    const m = menu.meals.find((x) => x.meal === meal)!;
    dispatch({ type: "addItems", day, meal, items: m.items });
    setAdded((a) => ({ ...a, [`${seed}:${meal}`]: true }));
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <View>
          <Eyebrow>{tr("Ovqatlanish rejasi")}</Eyebrow>
          <H1>{tr("Bugungi menyu")}</H1>
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={tr("Yopish")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.card, alignItems: "center", justifyContent: "center" }}>
          <Icon name="close" color={t.muted} />
        </Pressable>
      </Row>

      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={{ color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.8 }}>
            {menu.total.kcal}
            <Text style={{ color: t.faint, fontSize: 14, fontWeight: "600" }}> / {tg.calories} {tr("kkal")}</Text>
          </Text>
          <Pressable onPress={() => setSeed((s) => s + 1)} style={{ flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: t.card2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Icon name="refresh" size={16} color={t.text} />
            <Text style={{ color: t.text, fontWeight: "800" }}>{tr("Boshqa")}</Text>
          </Pressable>
        </Row>
        <Row style={{ gap: 14 }}>
          <MacroBar label={tr("Oqsil")} value={menu.total.protein} max={tg.protein} color={t.protein} />
          <MacroBar label={tr("Yog'")} value={menu.total.fat} max={tg.fat} color={t.fat} />
          <MacroBar label={tr("Uglevod")} value={menu.total.carbs} max={tg.carbs} color={t.carbs} />
        </Row>
        <Muted style={{ fontSize: 12 }}>{tr("O'zbek taomlaridan, maqsadingizga mos (oqsilga ustunlik) tuzildi. Porsiyalar me'yorga moslab o'zgartirilgan.")}</Muted>
      </Card>

      {menu.meals.map((m) => {
        const done = added[`${seed}:${m.meal}`];
        return (
          <Card key={m.meal} style={{ gap: 8 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>{tr(MENU_MEAL_LABELS[m.meal])}</Text>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: "800" }}>{m.total.kcal} {tr("kkal")}</Text>
            </Row>
            {m.items.map((i) => (
              <Row key={i.food.id} style={{ justifyContent: "space-between" }}>
                <Muted>
                  {i.food.name[lang]} · {i.grams} {i.food.liquid ? "ml" : "g"}
                </Muted>
                <Muted>{i.nutrition.kcal}</Muted>
              </Row>
            ))}
            <Muted style={{ fontSize: 12 }}>
              {tr("O")} {Math.round(m.total.protein)} g · {tr("Y")} {Math.round(m.total.fat)} g · {tr("U")} {Math.round(m.total.carbs)} g
            </Muted>
            <Button kind={done ? "ghost" : "primary"} title={done ? tr("Qo'shildi ✓") : tr("Kundalikka qo'shish")} disabled={done} onPress={() => add(m.meal)} />
          </Card>
        );
      })}
    </ScrollView>
  );
}
