import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { ParsedItem, SizeKey } from "@ozginbol/core";
import { SIZE_LABELS, formatUnit, parseMeal, scaleMacros, searchFoods, sumMacros } from "@ozginbol/core";
import FoodInfo from "../components/FoodInfo";
import { Button, Card, Chip, H1, Input, Muted, Row } from "../components/ui";
import { MEALS, frequentInputs, type MealType } from "../diary";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";

const POPULAR = ["1 porsiya osh", "1 ta somsa", "1 kosa lag'mon", "5 ta manti", "1 bo'lak non", "1 piyola choy", "2 ta tuxum", "1 stakan qatiq"];

export default function AddFood({ day, meal: initialMeal, onClose, onMyFoods }: { day: string; meal: MealType; onClose: () => void; onMyFoods: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr, lang } = useT();
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [text, setText] = useState("");
  const [edits, setEdits] = useState<Record<number, { g: number; size?: SizeKey }>>({});
  const [open, setOpen] = useState<number | null>(null);
  const parsed = useMemo(() => parseMeal(text, { extraFoods: state.customFoods }), [text, state.customFoods]);
  const quick = useMemo(() => {
    const mine = frequentInputs(state, 8);
    return [...mine, ...POPULAR.filter((p) => !mine.includes(p))].slice(0, 10);
  }, [state]);

  const items: ParsedItem[] = parsed.items.map((it, i) => {
    const e = edits[i];
    if (!e) return it;
    const unitG = e.size && it.food.sizes?.[e.size] ? it.food.sizes[e.size]! : it.grams / it.quantity;
    return { ...it, grams: e.g, quantity: Math.round((e.g / unitG) * 10) / 10, size: e.size ?? it.size, nutrition: scaleMacros(it.food.per100, e.g) };
  });
  const total = sumMacros(items.map((i) => i.nutrition));
  const setG = (i: number, g: number, size?: SizeKey) => setEdits((o) => ({ ...o, [i]: { g: Math.max(1, Math.round(g)), size: size ?? o[i]?.size } }));

  const append = (s: string) => {
    setEdits({});
    setText((cur) => (cur.trim() ? `${cur.trim()}, ${s}` : s));
  };
  const save = () => {
    if (!items.length) return;
    dispatch({ type: "addItems", day, meal, items });
    onClose();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Row style={{ justifyContent: "space-between" }}>
        <H1>{tr("Nima yedingiz?")}</H1>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={tr("Yopish")}>
          <Text style={{ color: t.muted, fontSize: 28 }}>×</Text>
        </Pressable>
      </Row>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {MEALS.map((m) => (
          <Chip key={m.id} label={`${m.icon} ${tr(m.label)}`} active={meal === m.id} onPress={() => setMeal(m.id)} />
        ))}
      </View>

      <Input
        value={text}
        onChangeText={(v) => {
          setText(v);
          setEdits({});
        }}
        placeholder={tr("Masalan: 2 ta katta somsa va 1 piyola choy")}
        multiline
        autoFocus
        style={{ minHeight: 90, fontSize: 18, textAlignVertical: "top" }}
      />

      {items.length > 0 && (
        <Card>
          {items.map((it, i) => {
            const unitG = it.grams / it.quantity;
            const count = Math.max(1, Math.round(it.quantity));
            const sizes = it.food.sizes && it.unit === it.food.defaultUnit ? it.food.sizes : null;
            return (
              <View key={i} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}>
                <Pressable onPress={() => setOpen(open === i ? null : i)}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: t.text, fontWeight: "600", fontSize: 15 }}>{it.food.name[lang]}</Text>
                      <Muted>
                        {it.unit === "g" || it.unit === "ml" ? "" : `${formatUnit(it.unit, it.quantity, lang)}${it.size ? ` (${tr(SIZE_LABELS[it.size])})` : ""} · `}
                        {it.grams} {it.food.liquid ? "ml" : "g"}
                        {it.confidence < 0.9 ? ` · ${tr('"{input}" deb tushundik', { input: it.input })}` : ""}
                      </Muted>
                    </View>
                    <Text style={{ color: t.text, fontWeight: "800", fontSize: 16 }}>{it.nutrition.kcal}</Text>
                  </Row>
                </Pressable>
                {open === i && (
                  <View style={{ marginTop: 8 }}>
                    <Row style={{ flexWrap: "wrap" }}>
                      <Chip label="−" onPress={() => setG(i, it.grams - (it.unit === "g" || it.unit === "ml" ? 50 : unitG * 0.5))} />
                      <Chip label="+" onPress={() => setG(i, it.grams + (it.unit === "g" || it.unit === "ml" ? 50 : unitG * 0.5))} />
                      {sizes &&
                        (Object.keys(sizes) as SizeKey[]).map((s) => (
                          <Chip key={s} label={`${tr(SIZE_LABELS[s])} ${sizes[s]} g`} active={it.grams === sizes[s]! * count} onPress={() => setG(i, sizes[s]! * count, s)} />
                        ))}
                    </Row>
                    <FoodInfo food={it.food} />
                  </View>
                )}
              </View>
            );
          })}
          <Row style={{ justifyContent: "space-between", marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
            <Muted>
              {tr("O")} {Math.round(total.protein)} g · {tr("Y")} {Math.round(total.fat)} g · {tr("U")} {Math.round(total.carbs)} g
            </Muted>
            <Text style={{ color: t.accent, fontWeight: "800", fontSize: 20 }}>{total.kcal} {tr("kkal")}</Text>
          </Row>
          <Muted style={{ fontSize: 12, marginTop: 4 }}>{tr("Taomni bosing: hajmi, grammi va kaloriya manbasi.")}</Muted>
        </Card>
      )}

      {parsed.unknown.map((u) => {
        const sugg = searchFoods(u, 3, state.customFoods);
        return (
          <Card key={u} style={{ backgroundColor: t.card2 }}>
            <Text style={{ color: t.text }}>{tr('"{u}" bazada topilmadi.', { u })}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
              {sugg.map((s) => (
                <Chip key={s.id} label={s.name[lang]} onPress={() => setText((cur) => cur.replace(u, s.aliases[0] ?? s.name.uz))} />
              ))}
              <Chip label={tr("➕ O'zim qo'shaman")} onPress={onMyFoods} />
            </View>
          </Card>
        );
      })}

      <Button title={items.length ? `${tr("Qo'shish")} · ${total.kcal} ${tr("kkal")}` : tr("Qo'shish")} onPress={save} disabled={!items.length} />

      <View>
        <Text style={{ color: t.muted, marginBottom: 8 }}>{tr("Tez qo'shish")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {state.savedMeals.map((m) => (
            <Chip key={m.id} label={`★ ${m.name}`} onPress={() => append(m.text)} />
          ))}
          {state.customFoods.slice(-4).map((f) => (
            <Chip key={f.id} label={`⭐ ${f.name[lang]}`} onPress={() => append(f.portions.dona ? `1 ta ${f.name.uz}` : `100 g ${f.name.uz}`)} />
          ))}
          {quick.map((q) => (
            <Chip key={q} label={q} onPress={() => append(q)} />
          ))}
        </View>
      </View>
      <Button kind="ghost" title={tr("➕ O'z mahsulotim · retsept · shtrix-kod")} onPress={onMyFoods} />
    </ScrollView>
  );
}
