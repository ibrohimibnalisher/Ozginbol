import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { EXERCISES, EXERCISE_LIBRARY, caloriesBurned, trainingPlan } from "@ozginbol/core";
import { Button, Card, Chip, H1, H2, Input, Muted, Row, Segmented } from "../components/ui";
import { dayKey } from "../diary";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";

export default function Training() {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr, lang } = useT();
  const [ex, setEx] = useState("walk");
  const [min, setMin] = useState("30");
  const [open, setOpen] = useState<string | null>(null);
  const [place, setPlace] = useState<"uy" | "zal">("uy");
  const today = dayKey();
  const todays = state.workouts.filter((w) => w.day === today);
  const minutes = parseInt(min, 10);
  const weight = state.profile?.weightKg ?? 70;
  const preview = minutes > 0 && minutes <= 600 ? caloriesBurned(ex, weight, minutes) : 0;
  const plan = trainingPlan(state.profile?.goal ?? "maintain");

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <H1>{tr("Mashg'ulot")}</H1>

      <Card>
        <H2>{tr("Mashg'ulot qo'shish")}</H2>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {EXERCISES.map((e) => (
            <Chip key={e.id} label={e.name[lang]} active={ex === e.id} onPress={() => setEx(e.id)} />
          ))}
        </View>
        <Row style={{ gap: 10, marginTop: 6 }}>
          <View style={{ width: 110 }}>
            <Input value={min} onChangeText={setMin} keyboardType="number-pad" placeholder={tr("daqiqa")} />
          </View>
          <Muted style={{ flex: 1 }}>{tr("daqiqa ≈ {n} kkal", { n: preview })}</Muted>
          <Button title={tr("Qo'shish")} disabled={!preview} onPress={() => dispatch({ type: "workout", day: today, exerciseId: ex, minutes })} />
        </Row>
        {todays.map((w) => (
          <Row key={w.id} style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: t.border, paddingVertical: 10, marginTop: 10 }}>
            <Text style={{ color: t.text }}>
              {EXERCISES.find((e) => e.id === w.exerciseId)?.name[lang]}, {w.minutes} {tr("daq")}
            </Text>
            <Row style={{ gap: 12 }}>
              <Text style={{ color: t.accent, fontWeight: "700" }}>−{w.kcal} {tr("kkal")}</Text>
              <Pressable onPress={() => dispatch({ type: "removeWorkout", id: w.id })} hitSlop={10} accessibilityLabel={tr("O'chirish")}>
                <Text style={{ color: t.muted, fontSize: 18 }}>×</Text>
              </Pressable>
            </Row>
          </Row>
        ))}
      </Card>

      <Card>
        <H2>{tr(plan.title)}</H2>
        <Muted>{tr(plan.summary)}</Muted>
        {plan.week.map((d) => (
          <View key={d.day} style={{ marginTop: 14 }}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 15 }}>
              {tr(d.day)}: {tr(d.focus)}
            </Text>
            {d.exercises.map((e) => (
              <Muted key={e}>• {tr(e)}</Muted>
            ))}
          </View>
        ))}
        <View style={{ marginTop: 14, gap: 4 }}>
          {plan.rules.map((r) => (
            <Text key={r} style={{ color: t.text, fontSize: 14 }}>
              ✅ {tr(r)}
            </Text>
          ))}
        </View>
        <Muted style={{ marginTop: 12, fontSize: 12 }}>{tr("Sog'lig'ingizda muammo bo'lsa, boshlashdan oldin shifokor bilan maslahatlashing.")}</Muted>
      </Card>
      <Card>
        <H2>{tr("Mashqlar texnikasi")}</H2>
        <Segmented value={place} onChange={setPlace} options={[{ id: "uy", label: tr("Uyda") }, { id: "zal", label: tr("Zalda") }]} />
        {EXERCISE_LIBRARY.filter((e) => e.equipment === place).map((e, i) => (
          <Pressable key={e.id} onPress={() => setOpen(open === e.id ? null : e.id)} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.border, marginTop: i ? 0 : 8 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: "800", fontSize: 15 }}>{tr(e.name)}</Text>
                <Muted style={{ fontSize: 12 }}>
                  {tr(e.muscles)} · {tr(e.level)}
                </Muted>
              </View>
              <Text style={{ color: t.faint, fontSize: 18 }}>{open === e.id ? "−" : "+"}</Text>
            </Row>
            {open === e.id && (
              <View style={{ marginTop: 8, gap: 4 }}>
                {e.steps.map((st, k) => (
                  <Text key={st} style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>
                    {k + 1}. {tr(st)}
                  </Text>
                ))}
                <Text style={{ color: t.warn, fontSize: 13, fontWeight: "800", marginTop: 6 }}>{tr("Ko'p uchraydigan xatolar")}</Text>
                {e.mistakes.map((m) => (
                  <Muted key={m} style={{ fontSize: 13 }}>
                    ✕ {tr(m)}
                  </Muted>
                ))}
              </View>
            )}
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}
