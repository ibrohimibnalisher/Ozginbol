import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import type { Food } from "@ozginbol/core";
import { createCustomFood, createRecipeFood } from "@ozginbol/core";
import { lookupBarcode } from "../barcode";
import FoodInfo from "../components/FoodInfo";
import { Button, Card, Chip, H1, Input, Muted, Row } from "../components/ui";
import { useDiary } from "../store";
import { useTheme } from "../theme";
import Scanner from "./Scanner";

type Mode = "product" | "recipe" | "barcode";

export default function MyFoods({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [mode, setMode] = useState<Mode>("product");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [name, setName] = useState("");
  const [per, setPer] = useState<"100" | "portion">("100");
  const [v, setV] = useState({ kcal: "", protein: "", fat: "", carbs: "", portion: "" });
  const [ingredients, setIngredients] = useState("");
  const [yieldG, setYieldG] = useState("");
  const [servings, setServings] = useState("");
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const n = (s: string) => (s.trim() === "" ? NaN : parseFloat(s.replace(",", ".")));
  const save = (food: Food) => {
    dispatch({ type: "saveFood", food });
    setMsg({ text: `✅ "${food.name.uz}" saqlandi: 100 g da ${food.per100.kcal} kkal. Endi uni oddiy yozasiz.`, ok: true });
  };

  const recipePreview = (() => {
    if (mode !== "recipe" || !ingredients.trim()) return null;
    try {
      return createRecipeFood({ name: name || "Retsept", ingredients, yieldG: n(yieldG) || undefined, servings: n(servings) || undefined }, state.customFoods);
    } catch {
      return null;
    }
  })();

  const addProduct = () => {
    try {
      const m = { kcal: n(v.kcal), protein: n(v.protein) || 0, fat: n(v.fat) || 0, carbs: n(v.carbs) || 0 };
      if (!Number.isFinite(m.kcal)) throw new Error("Kaloriyani kiriting");
      const portion = n(v.portion);
      if (per === "portion" && !Number.isFinite(portion)) throw new Error("1 dona og'irligini kiriting");
      save(createCustomFood({ name, ...(per === "100" ? { per100: m } : { perPortion: m }), portionGrams: Number.isFinite(portion) ? portion : undefined }));
      setName("");
      setV({ kcal: "", protein: "", fat: "", carbs: "", portion: "" });
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
    }
  };

  const addRecipe = () => {
    if (!recipePreview) return setMsg({ text: "Masalliqlarni yozing: 500 g un, 1 kg go'sht...", ok: false });
    save(createRecipeFood({ name, ingredients, yieldG: n(yieldG) || undefined, servings: n(servings) || undefined }, state.customFoods).food);
    setName("");
    setIngredients("");
    setYieldG("");
    setServings("");
  };

  const findCode = async (c: string) => {
    setScanning(false);
    setCode(c);
    setBusy(true);
    setMsg(null);
    try {
      const food = await lookupBarcode(c);
      if (food) save(food);
      else setMsg({ text: `Shtrix-kod ${c} Open Food Facts bazasida topilmadi. "Mahsulot" bo'limida yorliqdan qo'shing.`, ok: false });
    } catch {
      setMsg({ text: "Internet bilan bog'lanib bo'lmadi.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  if (scanning) return <Scanner onCode={findCode} onCancel={() => setScanning(false)} />;

  const field = (label: string, key: keyof typeof v, ph = "") => (
    <View style={{ flex: 1, minWidth: 90 }}>
      <Muted style={{ marginBottom: 4 }}>{label}</Muted>
      <Input value={v[key]} onChangeText={(x) => setV({ ...v, [key]: x })} keyboardType="decimal-pad" placeholder={ph} />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Row style={{ justifyContent: "space-between" }}>
        <H1>Mahsulotlarim</H1>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Yopish">
          <Text style={{ color: t.muted, fontSize: 28 }}>×</Text>
        </Pressable>
      </Row>

      <Row style={{ flexWrap: "wrap" }}>
        <Chip label="🏷 Mahsulot" active={mode === "product"} onPress={() => setMode("product")} />
        <Chip label="🍲 Retsept" active={mode === "recipe"} onPress={() => setMode("recipe")} />
        <Chip label="📷 Shtrix-kod" active={mode === "barcode"} onPress={() => setMode("barcode")} />
      </Row>

      {msg && (
        <Card style={{ backgroundColor: msg.ok ? t.accentSoft : t.card2, borderColor: "transparent", paddingVertical: 12 }}>
          <Text style={{ color: msg.ok ? t.text : t.warn }}>{msg.text}</Text>
        </Card>
      )}

      {mode === "product" && (
        <Card style={{ gap: 10 }}>
          <Input value={name} onChangeText={setName} placeholder="Nomi, masalan: Agusha tvorog" />
          <Row>
            <Chip label="100 g uchun" active={per === "100"} onPress={() => setPer("100")} />
            <Chip label="1 dona uchun" active={per === "portion"} onPress={() => setPer("portion")} />
          </Row>
          <Row style={{ gap: 8, flexWrap: "wrap" }}>
            {field("Kkal", "kcal")}
            {field("Oqsil, g", "protein")}
            {field("Yog', g", "fat")}
            {field("Uglevod, g", "carbs")}
          </Row>
          {field("1 dona og'irligi, g", "portion", per === "100" ? "ixtiyoriy" : "majburiy")}
          <Button title="Saqlash" onPress={addProduct} disabled={!name.trim()} />
        </Card>
      )}

      {mode === "recipe" && (
        <Card style={{ gap: 10 }}>
          <Input value={name} onChangeText={setName} placeholder="Nomi, masalan: Onamning oshi" />
          <Input
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            placeholder="1 kg guruch, 1 kg mol go'shti, 250 g yog', 1 kg sabzi, 300 g piyoz"
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Row style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Muted style={{ marginBottom: 4 }}>Tayyor og'irligi, g</Muted>
              <Input value={yieldG} onChangeText={setYieldG} keyboardType="number-pad" placeholder="tortib ko'ring" />
            </View>
            <View style={{ flex: 1 }}>
              <Muted style={{ marginBottom: 4 }}>Necha porsiya</Muted>
              <Input value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="ixtiyoriy" />
            </View>
          </Row>
          {recipePreview && (
            <View style={{ backgroundColor: t.card2, borderRadius: 12, padding: 12 }}>
              {recipePreview.parsed.items.map((i) => (
                <Muted key={i.input}>
                  {i.grams} g {i.food.name.uz}: {i.nutrition.kcal} kkal
                </Muted>
              ))}
              {recipePreview.parsed.unknown.length > 0 && <Text style={{ color: t.warn }}>Topilmadi: {recipePreview.parsed.unknown.join(", ")}</Text>}
              <Text style={{ color: t.text, fontWeight: "700", marginTop: 6 }}>
                100 g da {recipePreview.food.per100.kcal} kkal
                {recipePreview.food.portions.porsiya
                  ? ` · 1 porsiya ${recipePreview.food.portions.porsiya} g = ${Math.round((recipePreview.food.per100.kcal * recipePreview.food.portions.porsiya) / 100)} kkal`
                  : ""}
              </Text>
            </View>
          )}
          <Button title="Saqlash" onPress={addRecipe} disabled={!name.trim()} />
        </Card>
      )}

      {mode === "barcode" && (
        <Card style={{ gap: 10 }}>
          <Muted>Do'kon mahsulotining shtrix-kodini skanerlang: qiymatlar Open Food Facts ochiq bazasidan olinadi.</Muted>
          {Platform.OS !== "web" && <Button title={busy ? "Qidirilmoqda..." : "📷 Kamerani ochish"} onPress={() => setScanning(true)} disabled={busy} />}
          <Row style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="yoki raqamini yozing" />
            </View>
            <Button kind="ghost" title="Topish" onPress={() => code.trim() && findCode(code.trim())} disabled={busy} />
          </Row>
        </Card>
      )}

      {state.customFoods.length > 0 && (
        <Card>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: "700", marginBottom: 4 }}>Saqlanganlar</Text>
          {state.customFoods.map((f) => (
            <View key={f.id} style={{ borderTopWidth: 1, borderTopColor: t.border, paddingVertical: 10 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Pressable style={{ flex: 1 }} onPress={() => setOpen(open === f.id ? null : f.id)}>
                  <Text style={{ color: t.text, fontWeight: "600" }}>{f.name.uz}</Text>
                  <Muted>
                    100 g: {f.per100.kcal} kkal{f.portions.dona ? ` · 1 dona ${f.portions.dona} g` : ""}
                    {f.recipe ? " · retsept" : f.id.startsWith("off:") ? " · shtrix-kod" : ""}
                  </Muted>
                </Pressable>
                <Pressable onPress={() => dispatch({ type: "removeFood", id: f.id })} hitSlop={10} accessibilityLabel={`${f.name.uz}ni o'chirish`}>
                  <Text style={{ color: t.muted, fontSize: 20 }}>🗑</Text>
                </Pressable>
              </Row>
              {open === f.id && <FoodInfo food={f} />}
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
