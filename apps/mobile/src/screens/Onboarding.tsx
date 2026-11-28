import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import type { Activity, Goal, Profile, Sex } from "@ozginbol/core";
import { GOAL_INFO, LANGS, computeTargets } from "@ozginbol/core";
import { Button, Icon, Input, Muted, Row, Segmented, type IconName } from "../components/ui";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";

export const ACTIVITY: { id: Activity; label: string }[] = [
  { id: "sedentary", label: "Kam harakat (ofis)" },
  { id: "light", label: "Haftada 1-3 mashg'ulot" },
  { id: "moderate", label: "Haftada 3-5 mashg'ulot" },
  { id: "active", label: "Har kuni mashg'ulot" },
  { id: "very_active", label: "Og'ir jismoniy ish" },
];
export const GOALS: { id: Goal; label: string; hint: string; icon: IconName }[] = [
  { id: "cut", label: "Sushka", hint: "Mushakni saqlab yog'ni quritish", icon: "flame" },
  { id: "lose", label: "Ozish", hint: "Defitsit 25% gacha", icon: "chart" },
  { id: "maintain", label: "Vaznni saqlash", hint: "Vazn joyida qoladi", icon: "scale" },
  { id: "gain", label: "Massa nabor", hint: "Mushak, ortiqcha yog'siz", icon: "run" },
];

/** Profile form used for first launch and for editing later. */
export function ProfileForm({ initial, onDone, cta }: { initial?: Profile | null; onDone: (p: Profile) => void; cta: string }) {
  const t = useTheme();
  const { tr } = useT();
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

  const label = (s: string) => <Text style={{ color: t.text, marginBottom: 8, marginTop: 20, fontSize: 14, fontWeight: "800" }}>{tr(s)}</Text>;

  return (
    <View>
      {label("Maqsad")}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {GOALS.map((g) => {
          const on = goal === g.id;
          return (
            <Pressable
              key={g.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                setGoal(g.id);
                setRate(GOAL_INFO[g.id].defaultRate);
              }}
              style={{
                flexBasis: "47%",
                flexGrow: 1,
                padding: 14,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: on ? t.accent : t.border,
                backgroundColor: on ? t.accentSoft : t.card,
                gap: 8,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: on ? t.accent : t.card2 }}>
                <Icon name={g.icon} size={19} color={on ? t.accentInk : t.muted} />
              </View>
              <Text style={{ color: t.text, fontWeight: "800", fontSize: 15 }}>{tr(g.label)}</Text>
              <Text style={{ color: t.muted, fontSize: 12, lineHeight: 16 }}>{tr(g.hint)}</Text>
            </Pressable>
          );
        })}
      </View>

      {label("Jins")}
      <Segmented
        value={sex}
        onChange={setSex}
        options={[
          { id: "male", label: tr("Erkak") },
          { id: "female", label: tr("Ayol") },
        ]}
      />
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
      <View style={{ backgroundColor: t.card, borderRadius: 18, borderWidth: t.dark ? 1 : 0, borderColor: t.border, overflow: "hidden" }}>
        {ACTIVITY.map((a, i) => {
          const on = activity === a.id;
          return (
            <Pressable
              key={a.id}
              onPress={() => setActivity(a.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? t.accent : t.faint, alignItems: "center", justifyContent: "center" }}>
                {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent }} />}
              </View>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: on ? "800" : "500" }}>{tr(a.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {goal !== "maintain" && (
        <>
          {label("Tezlik")}
          <Segmented value={String(rate)} onChange={(v) => setRate(Number(v))} options={GOAL_INFO[goal].rates.map((r) => ({ id: String(r), label: `${r} kg` }))} />
          <Muted style={{ fontSize: 12, marginTop: 6 }}>{tr("haftasiga")}</Muted>
        </>
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {goal !== "maintain" && (
          <View style={{ flex: 1 }}>
            {label("Maqsad vazn, kg")}
            <Input value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder={tr("ixtiyoriy")} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          {label("Yog' foizi, %")}
          <Input value={fatPct} onChangeText={setFatPct} keyboardType="decimal-pad" placeholder={tr("bilsangiz")} />
        </View>
      </View>

      {preview && (
        <View style={{ marginTop: 22, backgroundColor: t.hero, borderRadius: 24, padding: 20, overflow: "hidden" }}>
          <View style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: t.heroAccent, opacity: 0.08, top: -100, right: -70 }} />
          <Text style={{ color: t.heroMuted, fontSize: 13, fontWeight: "700" }}>{tr("Kunlik me'yoringiz")}</Text>
          <Text style={{ color: t.heroText, fontSize: 44, fontWeight: "800", letterSpacing: -1.5 }}>
            {preview.calories}
            <Text style={{ fontSize: 16, color: t.heroMuted, fontWeight: "700" }}> {tr("kkal")}</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            {[
              [tr("Oqsil"), preview.protein, t.protein],
              [tr("Yog'"), preview.fat, t.fat],
              [tr("Uglevod"), preview.carbs, t.carbs],
            ].map(([l, v, c]) => (
              <View key={l as string} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, padding: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c as string, marginBottom: 6 }} />
                <Text style={{ color: t.heroText, fontSize: 18, fontWeight: "800" }}>{v} g</Text>
                <Text style={{ color: t.heroMuted, fontSize: 12, fontWeight: "600" }}>{l}</Text>
              </View>
            ))}
          </View>
          {preview.weeksToTarget !== null && (
            <Text style={{ color: t.heroText, marginTop: 12, fontWeight: "600" }}>{tr("Maqsadga taxminan {n} haftada yetasiz", { n: preview.weeksToTarget })}</Text>
          )}
          {preview.warnings.map((w) => (
            <Text key={w} style={{ color: "#ffc59e", marginTop: 8, fontSize: 13 }}>
              {tr(w)}
            </Text>
          ))}
          <Text style={{ color: t.heroText, fontWeight: "800", marginTop: 14, marginBottom: 4 }}>{tr("Qanday hisoblandi")}</Text>
          {preview.steps.map((s, i) => (
            <Text key={s} style={{ color: t.heroMuted, fontSize: 12.5, lineHeight: 18 }}>
              {i + 1}. {tr(s)}
            </Text>
          ))}
          <Text style={{ color: t.heroMuted, fontSize: 12.5, marginTop: 6 }}>
            {tr("Sog'lom vazn: {a}-{b} kg · Suv {w} l", { a: preview.healthyWeight[0], b: preview.healthyWeight[1], w: (preview.waterMl / 1000).toFixed(1) })}
          </Text>
        </View>
      )}

      <View style={{ marginTop: 18 }}>
        <Button title={cta} onPress={() => valid && onDone(p)} disabled={!valid} />
      </View>
    </View>
  );
}

function Logo({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={10} fill="#2bd177" />
      <Circle cx={16} cy={16} r={8.5} fill="none" stroke="#04110a" strokeWidth={3} strokeDasharray="40 60" strokeLinecap="round" transform="rotate(-90 16 16)" />
      <Circle cx={16} cy={16} r={2.6} fill="#04110a" />
    </Svg>
  );
}

export default function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const t = useTheme();
  const { tr, lang } = useT();
  const { dispatch } = useDiary();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: t.hero, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" }}>
        <View style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: t.heroAccent, opacity: 0.08, top: -150, right: -90 }} />
        <Row style={{ justifyContent: "space-between" }}>
          <Logo />
          <Row style={{ gap: 6 }}>
            {LANGS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => dispatch({ type: "settings", patch: { lang: l.id } })}
                accessibilityLabel={l.label}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: lang === l.id ? t.heroAccent : "rgba(255,255,255,0.08)" }}
              >
                <Text style={{ color: lang === l.id ? "#04110a" : t.heroText, fontWeight: "800", fontSize: 12 }}>{l.short}</Text>
              </Pressable>
            ))}
          </Row>
        </Row>
        <Text style={{ color: t.heroText, fontSize: 32, fontWeight: "800", letterSpacing: -1, marginTop: 16 }}>Ozginbol</Text>
        <Text style={{ color: t.heroMuted, fontSize: 16, lineHeight: 23, marginTop: 6 }}>
          {tr('"2 ta somsa va choy" deb yozing, kaloriya va makrolarni o\'zimiz hisoblaymiz. Har bir raqamning manbasi ochiq.')}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: t.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4, marginTop: 22 }}>{tr("Maqsadingizni aniqlaylik")}</Text>
        <ProfileForm onDone={onDone} cta={tr("Boshlash")} />
      </View>
    </ScrollView>
  );
}
