import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { EXERCISES, caloriesBurned, trainingPlan } from "@ozginbol/core";
import { Button, Card, Chip, H1, H2, Input, Muted, Row } from "../components/ui";
import { dayKey } from "../diary";
import { useDiary } from "../store";
import { useTheme } from "../theme";

export default function Training() {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [ex, setEx] = useState("walk");
  const [min, setMin] = useState("30");
  const today = dayKey();
  const todays = state.workouts.filter((w) => w.day === today);
  const minutes = parseInt(min, 10);
  const weight = state.profile?.weightKg ?? 70;
  const preview = minutes > 0 && minutes <= 600 ? caloriesBurned(ex, weight, minutes) : 0;
  const plan = trainingPlan(state.profile?.goal ?? "maintain");

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <H1>Mashg'ulot</H1>

      <Card>
        <H2>Mashg'ulot qo'shish</H2>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {EXERCISES.map((e) => (
            <Chip key={e.id} label={e.name.uz} active={ex === e.id} onPress={() => setEx(e.id)} />
          ))}
        </View>
        <Row style={{ gap: 10, marginTop: 6 }}>
          <View style={{ width: 110 }}>
            <Input value={min} onChangeText={setMin} keyboardType="number-pad" placeholder="daqiqa" />
          </View>
          <Muted style={{ flex: 1 }}>daqiqa ≈ {preview} kkal</Muted>
          <Button title="Qo'shish" disabled={!preview} onPress={() => dispatch({ type: "workout", day: today, exerciseId: ex, minutes })} />
        </Row>
        {todays.map((w) => (
          <Row key={w.id} style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: t.border, paddingVertical: 10, marginTop: 10 }}>
            <Text style={{ color: t.text }}>
              {EXERCISES.find((e) => e.id === w.exerciseId)?.name.uz}, {w.minutes} daq
            </Text>
            <Row style={{ gap: 12 }}>
              <Text style={{ color: t.accent, fontWeight: "700" }}>−{w.kcal} kkal</Text>
              <Pressable onPress={() => dispatch({ type: "removeWorkout", id: w.id })} hitSlop={10} accessibilityLabel="O'chirish">
                <Text style={{ color: t.muted, fontSize: 18 }}>×</Text>
              </Pressable>
            </Row>
          </Row>
        ))}
      </Card>

      <Card>
        <H2>{plan.title}</H2>
        <Muted>{plan.summary}</Muted>
        {plan.week.map((d) => (
          <View key={d.day} style={{ marginTop: 14 }}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 15 }}>
              {d.day}: {d.focus}
            </Text>
            {d.exercises.map((e) => (
              <Muted key={e}>• {e}</Muted>
            ))}
          </View>
        ))}
        <View style={{ marginTop: 14, gap: 4 }}>
          {plan.rules.map((r) => (
            <Text key={r} style={{ color: t.text, fontSize: 14 }}>
              ✅ {r}
            </Text>
          ))}
        </View>
        <Muted style={{ marginTop: 12, fontSize: 12 }}>Sog'lig'ingizda muammo bo'lsa, boshlashdan oldin shifokor bilan maslahatlashing.</Muted>
      </Card>
    </ScrollView>
  );
}
