import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { FAT_CATEGORY_LABELS, fatCategory } from "@ozginbol/core";
import { Button, Card, H1, H2, Icon, IconTile, Input, Muted, Row } from "../components/ui";
import { dayKey, shiftDay, summarize, targetsOf } from "../diary";
import { useDiary } from "../store";
import { useTheme } from "../theme";

const WD = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export default function Progress({ onBody }: { onBody: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [w, setW] = useState("");
  const tg = targetsOf(state);
  const today = dayKey();
  const days = Array.from({ length: 7 }, (_, i) => summarize(state, shiftDay(today, i - 6)));
  const logged = days.filter((d) => d.entries.length);
  const max = Math.max(tg?.calories ?? 0, ...days.map((d) => d.food.kcal), 1);
  const avg = logged.length ? Math.round(logged.reduce((a, d) => a + d.food.kcal, 0) / logged.length) : 0;
  const avgP = logged.length ? Math.round(logged.reduce((a, d) => a + d.food.protein, 0) / logged.length) : 0;
  const inRange = tg ? logged.filter((d) => Math.abs(d.food.kcal - (tg.calories + d.burned)) <= tg.calories * 0.1).length : 0;

  const weights = state.weights.slice(-30);
  const wMin = Math.min(...weights.map((x) => x.kg));
  const wMax = Math.max(...weights.map((x) => x.kg));
  const W = 300;
  const H = 110;
  const pts = weights.map((x, i) => {
    const px = weights.length === 1 ? W / 2 : (i / (weights.length - 1)) * (W - 20) + 10;
    const py = wMax === wMin ? H / 2 : H - 10 - ((x.kg - wMin) / (wMax - wMin)) * (H - 20);
    return [px, py] as const;
  });
  const lastM = state.measurements[state.measurements.length - 1];
  const first = weights[0];
  const last = weights[weights.length - 1];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <H1>Hisobot</H1>

      <Card>
        <H2>Oxirgi 7 kun</H2>
        <Row style={{ alignItems: "flex-end", height: 150, gap: 8 }}>
          {days.map((d) => {
            const h = Math.max(4, (d.food.kcal / max) * 130);
            const over = tg && d.food.kcal > tg.calories + d.burned;
            const wd = WD[new Date(`${d.day}T12:00:00`).getDay()]!;
            return (
              <View key={d.day} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: t.muted, fontSize: 10, marginBottom: 2 }}>{d.food.kcal || ""}</Text>
                <View style={{ width: "62%", height: h, borderRadius: 8, backgroundColor: d.food.kcal ? (over ? t.warn : t.accent) : t.card2 }} />
                <Text style={{ color: d.day === today ? t.text : t.muted, fontSize: 12, marginTop: 4, fontWeight: d.day === today ? "700" : "400" }}>{wd}</Text>
              </View>
            );
          })}
        </Row>
        {tg && (
          <View style={{ marginTop: 6 }}>
            <Muted>Me'yor: {tg.calories} kkal</Muted>
          </View>
        )}
        <Row style={{ marginTop: 12, gap: 10 }}>
          {[
            ["O'rtacha", logged.length ? `${avg}` : "—", "kkal"],
            ["Me'yorda", tg ? `${inRange}/${logged.length}` : "—", "kun"],
            ["Oqsil", logged.length ? `${avgP}` : "—", tg ? `/ ${tg.protein} g` : "g"],
          ].map(([l, v, u]) => (
            <View key={l} style={{ flex: 1, backgroundColor: t.card2, borderRadius: 16, padding: 12 }}>
              <Muted>{l}</Muted>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: "800" }}>{v}</Text>
              <Muted>{u}</Muted>
            </View>
          ))}
        </Row>
      </Card>

      <Pressable onPress={onBody} accessibilityRole="button">
        <Card>
          <Row style={{ gap: 12 }}>
            <IconTile>
              <Icon name="ruler" size={20} color={t.accentStrong} />
            </IconTile>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Yog' foizi va o'lchamlar</Text>
              <Muted style={{ fontSize: 13 }}>
                {lastM
                  ? `${lastM.bodyFatPct}% · ${FAT_CATEGORY_LABELS[fatCategory(state.profile!.sex, lastM.bodyFatPct)]} · bel ${lastM.waistCm} sm`
                  : "Bo'yin va bel aylanasidan yog' foizini hisoblang"}
              </Muted>
            </View>
            <Icon name="chevronR" color={t.faint} />
          </Row>
        </Card>
      </Pressable>

      <Card>
        <H2>Vazn</H2>
        {weights.length > 0 ? (
          <>
            <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
              {pts.length > 1 && <Polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={t.accent} strokeWidth={3} />}
              {pts.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={4} fill={t.accent} />
              ))}
            </Svg>
            {first && last && (
              <Muted>
                {first.kg} → {last.kg} kg ({last.kg - first.kg > 0 ? "+" : ""}
                {Math.round((last.kg - first.kg) * 10) / 10} kg)
              </Muted>
            )}
          </>
        ) : (
          <Muted>Hali vazn yozilmagan.</Muted>
        )}
        <Row style={{ gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Input value={w} onChangeText={setW} keyboardType="decimal-pad" placeholder="Bugungi vazn, kg" />
          </View>
          <Button
            title="Saqlash"
            onPress={() => {
              const kg = parseFloat(w.replace(",", "."));
              if (kg >= 30 && kg <= 300) {
                dispatch({ type: "weight", day: today, kg });
                setW("");
              }
            }}
          />
        </Row>
      </Card>
    </ScrollView>
  );
}
