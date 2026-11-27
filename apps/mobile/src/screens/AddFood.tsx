import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { formatUnit, parseMeal, searchFoods } from "@ozginbol/core";
import { Button, Card, Chip, H1, Input, Muted, Row } from "../components/ui";
import { MEALS, frequentInputs, type MealType } from "../diary";
import { useDiary } from "../store";
import { useTheme } from "../theme";

const POPULAR = ["1 porsiya osh", "1 ta somsa", "1 kosa lag'mon", "5 ta manti", "1 bo'lak non", "1 piyola choy", "2 ta tuxum", "1 stakan qatiq"];

export default function AddFood({ day, meal: initialMeal, onClose }: { day: string; meal: MealType; onClose: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [text, setText] = useState("");
  const parsed = useMemo(() => parseMeal(text), [text]);
  const quick = useMemo(() => {
    const mine = frequentInputs(state, 8);
    return [...mine, ...POPULAR.filter((p) => !mine.includes(p))].slice(0, 10);
  }, [state]);

  const append = (s: string) => setText((cur) => (cur.trim() ? `${cur.trim()}, ${s}` : s));
  const save = () => {
    if (!parsed.items.length) return;
    dispatch({ type: "addItems", day, meal, items: parsed.items });
    onClose();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Row style={{ justifyContent: "space-between" }}>
        <H1>Nima yedingiz?</H1>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Yopish">
          <Text style={{ color: t.muted, fontSize: 28 }}>×</Text>
        </Pressable>
      </Row>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {MEALS.map((m) => (
          <Chip key={m.id} label={`${m.icon} ${m.label}`} active={meal === m.id} onPress={() => setMeal(m.id)} />
        ))}
      </View>

      <Input
        value={text}
        onChangeText={setText}
        placeholder="Masalan: 2 ta somsa va 1 piyola choy"
        multiline
        autoFocus
        style={{ minHeight: 90, fontSize: 18, textAlignVertical: "top" }}
      />

      {parsed.items.length > 0 && (
        <Card>
          {parsed.items.map((it, i) => (
            <Row key={i} style={{ justifyContent: "space-between", paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: t.text, fontWeight: "600", fontSize: 15 }}>{it.food.name.uz}</Text>
                <Muted>
                  {it.unit === "g" || it.unit === "ml" ? `${it.grams} ${it.unit}` : `${formatUnit(it.unit, it.quantity)} · ${it.grams} ${it.food.liquid ? "ml" : "g"}`}
                  {it.confidence < 0.9 ? ` · "${it.input}" deb tushundik` : ""}
                </Muted>
              </View>
              <Text style={{ color: t.text, fontWeight: "800", fontSize: 16 }}>{it.nutrition.kcal}</Text>
            </Row>
          ))}
          <Row style={{ justifyContent: "space-between", marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
            <Muted>
              O {Math.round(parsed.total.protein)} g · Y {Math.round(parsed.total.fat)} g · U {Math.round(parsed.total.carbs)} g
            </Muted>
            <Text style={{ color: t.accent, fontWeight: "800", fontSize: 20 }}>{parsed.total.kcal} kkal</Text>
          </Row>
        </Card>
      )}

      {parsed.unknown.map((u) => {
        const sugg = searchFoods(u, 3);
        return (
          <Card key={u} style={{ backgroundColor: t.card2 }}>
            <Text style={{ color: t.text }}>"{u}" bazada topilmadi.</Text>
            {sugg.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                {sugg.map((s) => (
                  <Chip key={s.id} label={s.name.uz} onPress={() => setText((cur) => cur.replace(u, s.aliases[0] ?? s.name.uz))} />
                ))}
              </View>
            )}
          </Card>
        );
      })}

      <Button title={parsed.items.length ? `Qo'shish · ${parsed.total.kcal} kkal` : "Qo'shish"} onPress={save} disabled={!parsed.items.length} />

      <View>
        <Text style={{ color: t.muted, marginBottom: 8 }}>Tez qo'shish</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {quick.map((q) => (
            <Chip key={q} label={q} onPress={() => append(q)} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
