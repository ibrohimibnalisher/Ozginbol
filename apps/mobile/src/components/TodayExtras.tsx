import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FASTING_PLANS, FASTING_WARNING, fastingStatus, formatDuration } from "@ozginbol/core";
import { quality, stepsKcal } from "../diary";
import { cancelFastEnd, scheduleFastEnd } from "../reminders";
import { useStepCounter } from "../steps";
import { useDiary } from "../store";
import { useTheme } from "../theme";
import { Button, Card, Icon, IconTile, Input, Muted, Ring, Row, Segmented } from "./ui";

const clock = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function ScoreCard({ day, isToday }: { day: string; isToday: boolean }) {
  const t = useTheme();
  const { state } = useDiary();
  const q = quality(state, day);
  // Judging a day at lunch time is unfair: score today only from the evening.
  if (!q || (isToday && new Date().getHours() < 18)) return null;
  const color = q.grade === "A" || q.grade === "B" ? t.accent : q.grade === "C" ? t.fat : t.warn;
  return (
    <Card>
      <Row style={{ gap: 14, alignItems: "flex-start" }}>
        <Ring value={q.score} max={100} size={64} stroke={7} color={color}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: "800" }}>{q.grade}</Text>
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Kun bahosi: {q.score}/100</Text>
          {q.good.slice(0, 2).map((g) => (
            <Text key={g} style={{ color: t.accent, fontSize: 13, fontWeight: "600", marginTop: 2 }}>
              ✓ {g}
            </Text>
          ))}
          {q.improve.slice(0, 2).map((g) => (
            <Text key={g} style={{ color: t.muted, fontSize: 13, marginTop: 2 }}>
              → {g}
            </Text>
          ))}
        </View>
      </Row>
    </Card>
  );
}

export function FastingCard() {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [now, setNow] = useState(Date.now());
  const active = state.fasting.active;
  const [hours, setHours] = useState(String(state.settings.fastingHours));

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [active]);

  const start = () => {
    const at = Date.now();
    dispatch({ type: "fastStart", at, hours: Number(hours) });
    setNow(at);
    void scheduleFastEnd(at + Number(hours) * 3600000);
  };
  const end = () => {
    dispatch({ type: "fastEnd", at: Date.now() });
    void cancelFastEnd();
  };

  if (!active) {
    const plan = FASTING_PLANS.find((p) => String(p.fastHours) === hours) ?? FASTING_PLANS[2]!;
    return (
      <Card style={{ gap: 12 }}>
        <Row style={{ gap: 12 }}>
          <IconTile bg={t.dark ? "#2a2410" : "#fff6db"}>
            <Icon name="clock" size={20} color={t.fat} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Interval ochlik</Text>
            <Muted style={{ fontSize: 13 }}>{plan.hint}</Muted>
          </View>
        </Row>
        <Segmented value={hours} onChange={setHours} options={FASTING_PLANS.map((p) => ({ id: String(p.fastHours), label: p.label }))} />
        <Button title={`Ochlikni boshlash · ${plan.fastHours} soat`} onPress={start} />
        <Muted style={{ fontSize: 11 }}>{FASTING_WARNING}</Muted>
      </Card>
    );
  }

  const st = fastingStatus(active.startedAt, active.hours, now);
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ gap: 16 }}>
        <Ring value={st.progress} max={1} size={104} stroke={10} color={st.done ? t.accent : t.fat}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: "800" }}>{Math.floor(st.elapsedMin / 60)}:{String(st.elapsedMin % 60).padStart(2, "0")}</Text>
          <Text style={{ color: t.muted, fontSize: 11, fontWeight: "700" }}>/ {active.hours} soat</Text>
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>{st.done ? "Maqsadga yetdingiz 🎉" : `${formatDuration(st.remainingMin)} qoldi`}</Text>
          <Muted style={{ fontSize: 13 }}>
            {clock(active.startedAt)} da boshlandi · {clock(st.endsAt)} da tugaydi
          </Muted>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: "800", marginTop: 8 }}>{st.stage.title}</Text>
          <Muted style={{ fontSize: 12 }}>{st.stage.text}</Muted>
        </View>
      </Row>
      <Button kind={st.done ? "primary" : "ghost"} title={st.done ? "Ochlikni yakunlash" : "Ochlikni to'xtatish"} onPress={end} />
    </Card>
  );
}

export function StepsCard({ day, isToday }: { day: string; isToday: boolean }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const steps = state.steps[day] ?? 0;
  const goal = state.settings.stepGoal;
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState("");
  useStepCounter(day, steps, (n) => dispatch({ type: "steps", day, steps: n }), isToday);
  const pct = Math.min(1, steps / goal);
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row style={{ gap: 12 }}>
          <IconTile bg={t.dark ? "#1b2140" : "#eaf0ff"}>
            <Icon name="steps" size={20} color={t.protein} />
          </IconTile>
          <View>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>
              {steps.toLocaleString("ru-RU")} <Text style={{ color: t.faint, fontSize: 13, fontWeight: "600" }}>/ {goal.toLocaleString("ru-RU")} qadam</Text>
            </Text>
            <Muted style={{ fontSize: 13 }}>≈ {stepsKcal(steps, state.profile?.weightKg ?? 70)} kkal yurishga</Muted>
          </View>
        </Row>
        <Pressable onPress={() => setEdit(!edit)} hitSlop={8}>
          <Text style={{ color: t.accent, fontWeight: "800" }}>{edit ? "Yopish" : "Kiritish"}</Text>
        </Pressable>
      </Row>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: t.card2, overflow: "hidden" }}>
        <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: t.protein }} />
      </View>
      {edit && (
        <Row style={{ gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input value={val} onChangeText={setVal} keyboardType="number-pad" placeholder="Qadamlar soni" />
          </View>
          <Button
            title="Saqlash"
            onPress={() => {
              const n = parseInt(val, 10);
              if (n >= 0 && n < 100000) dispatch({ type: "steps", day, steps: n });
              setVal("");
              setEdit(false);
            }}
          />
        </Row>
      )}
    </Card>
  );
}

export function MenuCta({ onMenu }: { onMenu: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onMenu} accessibilityRole="button">
      <Card>
        <Row style={{ gap: 12 }}>
          <IconTile>
            <Icon name="menu" size={20} color={t.accentStrong} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Bugungi menyu</Text>
            <Muted style={{ fontSize: 13 }}>Me'yoringizga mos kunlik menyu tuzib beramiz</Muted>
          </View>
          <Icon name="chevronR" color={t.faint} />
        </Row>
      </Card>
    </Pressable>
  );
}
