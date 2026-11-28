import { Text, View } from "react-native";
import type { Food } from "@ozginbol/core";
import { recipeLines, sourceText } from "@ozginbol/core";
import { useTheme } from "../theme";
import { Muted } from "./ui";

/** Where a food's numbers come from. */
export default function FoodInfo({ food }: { food: Food }) {
  const t = useTheme();
  const lines = recipeLines(food);
  return (
    <View style={{ backgroundColor: t.card2, borderRadius: 12, padding: 12, marginTop: 8 }}>
      <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
        <Text style={{ fontWeight: "700" }}>Manba: </Text>
        {sourceText(food)}
      </Text>
      {food.recipe && <Muted style={{ fontSize: 13, marginTop: 6 }}>{food.recipe.note}</Muted>}
      {lines.map((l, i) => (
        <Text key={i} style={{ color: i === lines.length - 1 ? t.text : t.muted, fontSize: 13, fontWeight: i === lines.length - 1 ? "700" : "400", marginTop: 2 }}>
          {i === lines.length - 1 ? "" : "• "}
          {l}
        </Text>
      ))}
      <Text style={{ color: t.text, fontSize: 13, marginTop: 6, fontWeight: "600" }}>
        100 g: {food.per100.kcal} kkal · O {food.per100.protein} · Y {food.per100.fat} · U {food.per100.carbs}
      </Text>
    </View>
  );
}
