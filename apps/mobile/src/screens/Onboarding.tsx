import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { Activity, Goal, Profile, Sex } from "@ozginbol/core";
import { computeTargets } from "@ozginbol/core";
import { Button, Card, Chip, H1, Input, Muted } from "../components/ui";
import { useTheme } from "../theme";

export const ACTIVITY: { id: Activity; label: string }[] = [
  { id: "sedentary", label: "Kam harakat (ofis)" },
  { id: "light", label: "Haftada 1-3 mashg'ulot" },
  { id: "moderate", label: "Haftada 3-5 mashg'ulot" },
  { id: "active", label: "Har kuni mashg'ulot" },
  { id: "very_active", label: "Og'ir jismoniy ish" },
];
export const GOALS: { id: Goal; label: string }[] = [
  { id: "lose", label: "Ozish" },
  { id: "maintain", label: "Vaznni saqlash" },
  { id: "gain", label: "Massa yig'ish" },
];

/** Profile form used for first launch and for editing later. */
export function ProfileForm({ initial, onDone, cta }: { initial?: Profile | null; onDone: (p: Profile) => void; cta: string }) {
  const t = useTheme();
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "male");
  const [age, setAge] = useState(initial ? String(initial.age) : "");
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : "");
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : "");
  const [activity, setActivity] = useState<Activity>(initial?.activity ?? "light");
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? "lose");

  const n = (s: string) => parseFloat(s.replace(",", "."));
  const p: Profile = { sex, age: n(age), heightCm: n(height), weightKg: n(weight), activity, goal };
  const valid = p.age >= 14 && p.age <= 100 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 300;
  const preview = valid ? computeTargets(p) : null;

  const label = (s: string) => <Text style={{ color: t.muted, marginBottom: 6, marginTop: 14, fontSize: 14 }}>{s}</Text>;

  return (
    <View>
      {label("Jins")}
      <View style={{ flexDirection: "row" }}>
        <Chip label="👨 Erkak" active={sex === "male"} onPress={() => setSex("male")} />
        <Chip label="👩 Ayol" active={sex === "female"} onPress={() => setSex("female")} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          {label("Yosh")}
          <Input value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="28" />
        </View>
        <View style={{ flex: 1 }}>
          {label("Bo'y, sm")}
          <Input value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="172" />
        </View>
        <View style={{ flex: 1 }}>
          {label("Vazn, kg")}
          <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="74" />
        </View>
      </View>
      {label("Faollik")}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {ACTIVITY.map((a) => (
          <Chip key={a.id} label={a.label} active={activity === a.id} onPress={() => setActivity(a.id)} />
        ))}
      </View>
      {label("Maqsad")}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {GOALS.map((g) => (
          <Chip key={g.id} label={g.label} active={goal === g.id} onPress={() => setGoal(g.id)} />
        ))}
      </View>

      {preview && (
        <Card style={{ marginTop: 16, backgroundColor: t.accentSoft, borderColor: t.accentSoft }}>
          <Text style={{ color: t.text, fontSize: 15 }}>Kunlik me'yoringiz</Text>
          <Text style={{ color: t.accent, fontSize: 34, fontWeight: "800" }}>{preview.calories} kkal</Text>
          <Muted>
            Oqsil {preview.protein} g · Yog' {preview.fat} g · Uglevod {preview.carbs} g · Suv {(preview.waterMl / 1000).toFixed(1)} l
          </Muted>
          {preview.weeklyChangeKg !== 0 && (
            <Muted style={{ marginTop: 4 }}>
              Haftasiga ~{Math.abs(preview.weeklyChangeKg)} kg {preview.weeklyChangeKg < 0 ? "ozasiz" : "qo'shasiz"}
            </Muted>
          )}
        </Card>
      )}

      <View style={{ marginTop: 18 }}>
        <Button title={cta} onPress={() => valid && onDone(p)} disabled={!valid} />
      </View>
    </View>
  );
}

export default function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const t = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 40, marginBottom: 8 }}>🥗</Text>
      <H1>Ozginbol</H1>
      <Muted style={{ marginTop: 6, fontSize: 16 }}>
        Nima yeganingizni oddiy yozing: "2 ta somsa va choy". Kaloriya, oqsil, yog' va uglevodni o'zimiz hisoblaymiz. Avval shaxsiy
        me'yoringizni aniqlaylik.
      </Muted>
      <ProfileForm onDone={onDone} cta="Boshlash" />
    </ScrollView>
  );
}
