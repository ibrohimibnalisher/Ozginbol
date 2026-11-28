import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { Activity, Goal, Profile, Sex } from "@ozginbol/core";
import { GOAL_INFO, computeTargets } from "@ozginbol/core";
import { Button, Card, Chip, H1, Input, Muted } from "../components/ui";
import { useTheme } from "../theme";

export const ACTIVITY: { id: Activity; label: string }[] = [
  { id: "sedentary", label: "Kam harakat (ofis)" },
  { id: "light", label: "Haftada 1-3 mashg'ulot" },
  { id: "moderate", label: "Haftada 3-5 mashg'ulot" },
  { id: "active", label: "Har kuni mashg'ulot" },
  { id: "very_active", label: "Og'ir jismoniy ish" },
];
export const GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: "cut", label: "🔥 Sushka", hint: "Mushakni saqlab yog'ni quritish, oqsil 2.2 g/kg" },
  { id: "lose", label: "⬇️ Ozish", hint: "Oddiy ozish, defitsit 25% gacha" },
  { id: "maintain", label: "⚖️ Saqlash", hint: "Vazn joyida qoladi" },
  { id: "gain", label: "💪 Massa nabor", hint: "Kichik ortiqcha, ortiqcha yog'siz" },
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
  const [rate, setRate] = useState<number>(initial?.rateKgPerWeek ?? GOAL_INFO[initial?.goal ?? "lose"].defaultRate);
  const [target, setTarget] = useState(initial?.targetWeightKg ? String(initial.targetWeightKg) : "");
  const [fatPct, setFatPct] = useState(initial?.bodyFatPct ? String(initial.bodyFatPct) : "");

  const n = (s: string) => parseFloat(s.replace(",", "."));
  const p: Profile = {
    sex, age: n(age), heightCm: n(height), weightKg: n(weight), activity, goal,
    ...(goal !== "maintain" ? { rateKgPerWeek: rate } : {}),
    ...(goal !== "maintain" && n(target) > 0 ? { targetWeightKg: n(target) } : {}),
    ...(n(fatPct) > 0 ? { bodyFatPct: n(fatPct) } : {}),
  };
  const valid = p.age >= 14 && p.age <= 100 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 300;
  const preview = valid ? computeTargets(p) : null;

  const label = (s: string) => <Text style={{ color: t.muted, marginBottom: 6, marginTop: 14, fontSize: 14 }}>{s}</Text>;

  return (
    <View>
      {label("Maqsad")}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {GOALS.map((g) => (
          <Chip
            key={g.id}
            label={g.label}
            active={goal === g.id}
            onPress={() => {
              setGoal(g.id);
              setRate(GOAL_INFO[g.id].defaultRate);
            }}
          />
        ))}
      </View>
      <Muted>{GOALS.find((g) => g.id === goal)!.hint}</Muted>

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

      {goal !== "maintain" && (
        <>
          {label("Tezlik")}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {GOAL_INFO[goal].rates.map((r) => (
              <Chip key={r} label={`${r} kg/hafta`} active={rate === r} onPress={() => setRate(r)} />
            ))}
          </View>
        </>
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {goal !== "maintain" && (
          <View style={{ flex: 1 }}>
            {label("Maqsad vazn, kg")}
            <Input value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="ixtiyoriy" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          {label("Yog' foizi, %")}
          <Input value={fatPct} onChangeText={setFatPct} keyboardType="decimal-pad" placeholder="bilsangiz" />
        </View>
      </View>

      {preview && (
        <Card style={{ marginTop: 16, backgroundColor: t.accentSoft, borderColor: t.accentSoft }}>
          <Text style={{ color: t.text, fontSize: 15 }}>Kunlik me'yoringiz</Text>
          <Text style={{ color: t.accent, fontSize: 34, fontWeight: "800" }}>{preview.calories} kkal</Text>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: "600" }}>
            Oqsil {preview.protein} g · Yog' {preview.fat} g · Uglevod {preview.carbs} g
          </Text>
          {preview.weeksToTarget !== null && (
            <Text style={{ color: t.text, marginTop: 6 }}>🏁 Maqsadga taxminan {preview.weeksToTarget} haftada yetasiz</Text>
          )}
          {preview.warnings.map((w) => (
            <Text key={w} style={{ color: t.warn, marginTop: 6, fontSize: 13 }}>
              ⚠️ {w}
            </Text>
          ))}
          <Text style={{ color: t.text, fontWeight: "700", marginTop: 10 }}>Qanday hisoblandi</Text>
          {preview.steps.map((s, i) => (
            <Muted key={s} style={{ fontSize: 13 }}>
              {i + 1}. {s}
            </Muted>
          ))}
          <Muted style={{ fontSize: 13, marginTop: 4 }}>
            Sog'lom vazn: {preview.healthyWeight[0]}-{preview.healthyWeight[1]} kg · Suv {(preview.waterMl / 1000).toFixed(1)} l
          </Muted>
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
        Nima yeganingizni oddiy yozing: "2 ta somsa va choy". Kaloriya, oqsil, yog' va uglevodni o'zimiz hisoblaymiz, har bir
        raqamning manbasi ochiq. Avval maqsad va me'yoringizni aniqlaylik.
      </Muted>
      <ProfileForm onDone={onDone} cta="Boshlash" />
    </ScrollView>
  );
}
