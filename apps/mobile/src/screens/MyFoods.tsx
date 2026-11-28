import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import type { Food } from "@ozginbol/core";
import { createCustomFood, createRecipeFood } from "@ozginbol/core";
import { lookupBarcode } from "../barcode";
import FoodInfo from "../components/FoodInfo";
import { Button, Card, Chip, H1, Input, Muted, Row } from "../components/ui";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";
import Scanner from "./Scanner";

type Mode = "product" | "recipe" | "barcode";

export default function MyFoods({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr, lang } = useT();
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
    setMsg({ text: tr('✅ "{name}" saqlandi: 100 g da {kcal} kkal. Endi uni oddiy yozasiz.', { name: food.name.uz, kcal: food.per100.kcal }), ok: true });
  };

  const recipePreview = (() => {
    if (mode !== "recipe" || !ingredients.trim()) return null;
    try {
      return createRecipeFood({ name: name || tr("Retsept"), ingredients, yieldG: n(yieldG) || undefined, servings: n(servings) || undefined }, state.customFoods);
    } catch {
      return null;
    }
  })();

  const addProduct = () => {
    try {
      const m = { kcal: n(v.kcal), protein: n(v.protein) || 0, fat: n(v.fat) || 0, carbs: n(v.carbs) || 0 };
      if (!Number.isFinite(m.kcal)) throw new Error(tr("Kaloriyani kiriting"));
      const portion = n(v.portion);
      if (per === "portion" && !Number.isFinite(portion)) throw new Error(tr("1 dona og'irligini kiriting"));
      save(createCustomFood({ name, ...(per === "100" ? { per100: m } : { perPortion: m }), portionGrams: Number.isFinite(portion) ? portion : undefined }));
      setName("");
      setV({ kcal: "", protein: "", fat: "", carbs: "", portion: "" });
    } catch (e) {
      setMsg({ text: tr((e as Error).message), ok: false });
    }
  };

  const addRecipe = () => {
    if (!recipePreview) return setMsg({ text: tr("Masalliqlarni yozing: 500 g un, 1 kg go'sht..."), ok: false });
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
      else setMsg({ text: tr('Shtrix-kod {c} Open Food Facts bazasida topilmadi. "Mahsulot" bo\'limida yorliqdan qo\'shing.', { c }), ok: false });
    } catch {
      setMsg({ text: tr("Internet bilan bog'lanib bo'lmadi."), ok: false });
    } finally {
      setBusy(false);
    }
  };

  if (scanning) return <Scanner onCode={findCode} onCancel={() => setScanning(false)} />;

  const field = (label: string, key: keyof typeof v, ph = "") => (
    <View style={{ flex: 1, minWidth: 90 }}>
      <Muted style={{ marginBottom: 4 }}>{tr(label)}</Muted>
      <Input value={v[key]} onChangeText={(x) => setV({ ...v, [key]: x })} keyboardType="decimal-pad" placeholder={ph && tr(ph)} />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Row style={{ justifyContent: "space-between" }}>
        <H1>{tr("Mahsulotlarim")}</H1>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={tr("Yopish")}>
          <Text style={{ color: t.muted, fontSize: 28 }}>×</Text>
        </Pressable>
      </Row>

      <Row style={{ flexWrap: "wrap" }}>
        <Chip label={tr("🏷 Mahsulot")} active={mode === "product"} onPress={() => setMode("product")} />
        <Chip label={tr("🍲 Retsept")} active={mode === "recipe"} onPress={() => setMode("recipe")} />
        <Chip label={tr("📷 Shtrix-kod")} active={mode === "barcode"} onPress={() => setMode("barcode")} />
      </Row>

      {msg && (
        <Card style={{ backgroundColor: msg.ok ? t.accentSoft : t.card2, borderColor: "transparent", paddingVertical: 12 }}>
          <Text style={{ color: msg.ok ? t.text : t.warn }}>{msg.text}</Text>
        </Card>
      )}

      {mode === "product" && (
        <Card style={{ gap: 10 }}>
          <Input value={name} onChangeText={setName} placeholder={tr("Nomi, masalan: Agusha tvorog")} />
          <Row>
            <Chip label={tr("100 g uchun")} active={per === "100"} onPress={() => setPer("100")} />
            <Chip label={tr("1 dona uchun")} active={per === "portion"} onPress={() => setPer("portion")} />
          </Row>
          <Row style={{ gap: 8, flexWrap: "wrap" }}>
            {field("Kkal", "kcal")}
            {field("Oqsil, g", "protein")}
            {field("Yog', g", "fat")}
            {field("Uglevod, g", "carbs")}
          </Row>
          {field("1 dona og'irligi, g", "portion", per === "100" ? tr("ixtiyoriy") : tr("majburiy"))}
          <Button title={tr("Saqlash")} onPress={addProduct} disabled={!name.trim()} />
        </Card>
      )}

      {mode === "recipe" && (
        <Card style={{ gap: 10 }}>
          <Input value={name} onChangeText={setName} placeholder={tr("Nomi, masalan: Onamning oshi")} />
          <Input
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            placeholder={tr("1 kg guruch, 1 kg mol go'shti, 250 g yog', 1 kg sabzi, 300 g piyoz")}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Row style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Muted style={{ marginBottom: 4 }}>{tr("Tayyor og'irligi, g")}</Muted>
              <Input value={yieldG} onChangeText={setYieldG} keyboardType="number-pad" placeholder={tr("tortib ko'ring")} />
            </View>
            <View style={{ flex: 1 }}>
              <Muted style={{ marginBottom: 4 }}>{tr("Necha porsiya")}</Muted>
              <Input value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder={tr("ixtiyoriy")} />
            </View>
          </Row>
          {recipePreview && (
            <View style={{ backgroundColor: t.card2, borderRadius: 12, padding: 12 }}>
              {recipePreview.parsed.items.map((i) => (
                <Muted key={i.input}>
                  {i.grams} g {i.food.name[lang]}: {i.nutrition.kcal} {tr("kkal")}
                </Muted>
              ))}
              {recipePreview.parsed.unknown.length > 0 && <Text style={{ color: t.warn }}>{tr("Topilmadi")}: {recipePreview.parsed.unknown.join(", ")}</Text>}
              <Text style={{ color: t.text, fontWeight: "700", marginTop: 6 }}>
                {tr("100 g da {kcal} kkal", { kcal: recipePreview.food.per100.kcal })}
                {recipePreview.food.portions.porsiya
                  ? ` · ${tr("1 porsiya {g} g = {kcal} kkal", { g: recipePreview.food.portions.porsiya, kcal: Math.round((recipePreview.food.per100.kcal * recipePreview.food.portions.porsiya) / 100) })}`
                  : ""}
              </Text>
            </View>
          )}
          <Button title={tr("Saqlash")} onPress={addRecipe} disabled={!name.trim()} />
        </Card>
      )}

      {mode === "barcode" && (
        <Card style={{ gap: 10 }}>
          <Muted>{tr("Do'kon mahsulotining shtrix-kodini skanerlang: qiymatlar Open Food Facts ochiq bazasidan olinadi.")}</Muted>
          {Platform.OS !== "web" && <Button title={busy ? tr("Qidirilmoqda...") : tr("📷 Kamerani ochish")} onPress={() => setScanning(true)} disabled={busy} />}
          <Row style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input value={code} onChangeText={setCode} keyboardType="number-pad" placeholder={tr("yoki raqamini yozing")} />
            </View>
            <Button kind="ghost" title={tr("Topish")} onPress={() => code.trim() && findCode(code.trim())} disabled={busy} />
          </Row>
        </Card>
      )}

      {state.customFoods.length > 0 && (
        <Card>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: "700", marginBottom: 4 }}>{tr("Saqlanganlar")}</Text>
          {state.customFoods.map((f) => (
            <View key={f.id} style={{ borderTopWidth: 1, borderTopColor: t.border, paddingVertical: 10 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Pressable style={{ flex: 1 }} onPress={() => setOpen(open === f.id ? null : f.id)}>
                  <Text style={{ color: t.text, fontWeight: "600" }}>{f.name.uz}</Text>
                  <Muted>
                    100 g: {f.per100.kcal} {tr("kkal")}
                    {f.portions.dona ? ` · ${tr("1 dona {g} g", { g: f.portions.dona })}` : ""}
                    {f.recipe ? ` · ${tr("retsept")}` : f.id.startsWith("off:") ? ` · ${tr("shtrix-kod")}` : ""}
                  </Muted>
                </Pressable>
                <Pressable onPress={() => dispatch({ type: "removeFood", id: f.id })} hitSlop={10} accessibilityLabel={tr("{name}ni o'chirish", { name: f.name.uz })}>
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
