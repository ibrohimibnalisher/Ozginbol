import { Text, View } from "react-native";
import type { Food } from "@ozginbol/core";
import { MICRO_INFO, MICRO_KEYS, formatMicro, recipeLines, sourceText } from "@ozginbol/core";
import { useT } from "../store";
import { useTheme } from "../theme";
import { Muted } from "./ui";

/** Where a food's numbers come from, plus its vitamins and minerals. */
export default function FoodInfo({ food }: { food: Food }) {
  const t = useTheme();
  const { tr, lang } = useT();
  const lines = recipeLines(food, lang);
  return (
    <View style={{ backgroundColor: t.card2, borderRadius: 12, padding: 12, marginTop: 8 }}>
      <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
        <Text style={{ fontWeight: "700" }}>{tr("Manba")}: </Text>
        {sourceText(food, lang)}
      </Text>
      {food.recipe && <Muted style={{ fontSize: 13, marginTop: 6 }}>{tr(food.recipe.note)}</Muted>}
      {lines.map((l, i) => (
        <Text key={i} style={{ color: i === lines.length - 1 ? t.text : t.muted, fontSize: 13, fontWeight: i === lines.length - 1 ? "700" : "400", marginTop: 2 }}>
          {i === lines.length - 1 ? "" : "• "}
          {l}
        </Text>
      ))}
      <Text style={{ color: t.text, fontSize: 13, marginTop: 6, fontWeight: "600" }}>
        100 g: {food.per100.kcal} {tr("kkal")} · {tr("O")} {food.per100.protein} · {tr("Y")} {food.per100.fat} · {tr("U")} {food.per100.carbs}
        {food.per100.fiber ? ` · ${tr("Kletchatka")} ${food.per100.fiber}` : ""}
      </Text>
      {food.micros && (
        <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {MICRO_KEYS.map((k) => (
            <View key={k} style={{ backgroundColor: t.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 }}>
              <Text style={{ color: t.muted, fontSize: 11, fontWeight: "700" }}>{MICRO_INFO[k].name[lang]}</Text>
              <Text style={{ color: t.text, fontSize: 13, fontWeight: "800" }}>{formatMicro(k, food.micros![k])}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
