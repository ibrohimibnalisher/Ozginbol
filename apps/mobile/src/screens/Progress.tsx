import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { FAT_CATEGORY_LABELS, achievements, fatCategory, weightTrend } from "@ozginbol/core";
import { Button, Card, H1, H2, Icon, IconTile, Input, Muted, Row } from "../components/ui";
import { adaptive, dayKey, habitStats, shiftDay, summarize, targetsOf } from "../diary";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";

const WD = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"]; // translated at render

export default function Progress({ onBody, onPhotos }: { onBody: () => void; onPhotos: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr } = useT();
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
  const ad = adaptive(state);
  const badges = achievements(habitStats(state));
  const earned = badges.filter((b) => b.earned).length;
  const trend = weightTrend(weights);
  const tPts = trend.length > 1 && weights.length > 1
    ? trend.map((x) => {
        const t0 = Date.parse(weights[0]!.day);
        const t1 = Date.parse(weights[weights.length - 1]!.day);
        const px = ((Date.parse(x.day) - t0) / Math.max(1, t1 - t0)) * (W - 20) + 10;
        const py = wMax === wMin ? H / 2 : H - 10 - ((x.kg - wMin) / (wMax - wMin)) * (H - 20);
        return `${px},${py}`;
      })
    : [];
  const first = weights[0];
  const last = weights[weights.length - 1];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <H1>{tr("Hisobot")}</H1>

      <Card>
        <H2>{tr("Oxirgi 7 kun")}</H2>
        <Row style={{ alignItems: "flex-end", height: 150, gap: 8 }}>
          {days.map((d) => {
            const h = Math.max(4, (d.food.kcal / max) * 130);
            const over = tg && d.food.kcal > tg.calories + d.burned;
            const wd = tr(WD[new Date(`${d.day}T12:00:00`).getDay()]!);
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
            <Muted>{tr("Me'yor: {n} kkal", { n: tg.calories })}</Muted>
          </View>
        )}
        <Row style={{ marginTop: 12, gap: 10 }}>
          {[
            [tr("O'rtacha"), logged.length ? `${avg}` : "—", tr("kkal")],
            [tr("Me'yorda"), tg ? `${inRange}/${logged.length}` : "—", tr("kun")],
            [tr("Oqsil"), logged.length ? `${avgP}` : "—", tg ? `/ ${tg.protein} g` : "g"],
          ].map(([l, v, u]) => (
            <View key={l} style={{ flex: 1, backgroundColor: t.card2, borderRadius: 16, padding: 12 }}>
              <Muted>{l}</Muted>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: "800" }}>{v}</Text>
              <Muted>{u}</Muted>
            </View>
          ))}
        </Row>
      </Card>

      <Card>
        <H2>{tr("Haqiqiy sarfingiz")}</H2>
        {ad ? (
          <>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 }}>
              {ad.tdee} <Text style={{ color: t.faint, fontSize: 14, fontWeight: "600" }}>{tr("kkal / kun")}</Text>
            </Text>
            <Muted style={{ fontSize: 13, marginTop: 4 }}>
              {tr("{days} kunda o'rtacha {avg} kkal yedingiz, trend vazn {delta} kg o'zgardi. Formula bo'yicha: {tdee} kkal. Ishonch: {conf}.", {
                days: ad.days,
                avg: ad.avgIntake,
                delta: `${ad.trendChangeKg > 0 ? "+" : ""}${ad.trendChangeKg}`,
                tdee: tg?.tdee ?? "—",
                conf: tr(ad.confidence === "high" ? "yuqori" : ad.confidence === "medium" ? "o'rtacha" : "past"),
              })}
            </Muted>
            {tg && Math.abs(ad.tdee - tg.tdee) > 150 && (
              <Text style={{ color: t.text, fontSize: 13, fontWeight: "700", marginTop: 8 }}>
                {tr("Tavsiya: me'yorni {n} kkal qiling (sarfingiz + maqsad farqi {d}).", { n: ad.tdee + tg.dailyDelta, d: tg.dailyDelta })}
              </Text>
            )}
          </>
        ) : (
          <Muted>
            {tr("Kamida 10 kun ovqat va 2 hafta davomida vazn yozilsa, tarozi va kundalikdan haqiqiy kaloriya sarfingizni hisoblaymiz (formula taxminidan aniqroq).")}
          </Muted>
        )}
      </Card>

      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <H2 style={{ marginBottom: 0 }}>{tr("Yutuqlar")}</H2>
          <Muted>
            {earned} / {badges.length}
          </Muted>
        </Row>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {badges.map((b) => (
            <View key={b.id} style={{ width: "31%", flexGrow: 1, backgroundColor: b.earned ? t.accentSoft : t.card2, borderRadius: 16, padding: 10, alignItems: "center", opacity: b.earned ? 1 : 0.75 }}>
              <Text style={{ fontSize: 26, opacity: b.earned ? 1 : 0.35 }}>{b.icon}</Text>
              <Text style={{ color: t.text, fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 4 }} numberOfLines={2}>
                {tr(b.title)}
              </Text>
              {!b.earned && (
                <View style={{ alignSelf: "stretch", height: 4, borderRadius: 2, backgroundColor: t.card3, marginTop: 6, overflow: "hidden" }}>
                  <View style={{ width: `${b.progress * 100}%`, height: 4, backgroundColor: t.accent }} />
                </View>
              )}
            </View>
          ))}
        </View>
      </Card>

      <Pressable onPress={onBody} accessibilityRole="button">
        <Card>
          <Row style={{ gap: 12 }}>
            <IconTile>
              <Icon name="ruler" size={20} color={t.accentStrong} />
            </IconTile>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>{tr("Yog' foizi va o'lchamlar")}</Text>
              <Muted style={{ fontSize: 13 }}>
                {lastM
                  ? `${lastM.bodyFatPct}% · ${tr(FAT_CATEGORY_LABELS[fatCategory(state.profile!.sex, lastM.bodyFatPct)])} · ${tr("bel")} ${lastM.waistCm} ${tr("sm")}`
                  : tr("Bo'yin va bel aylanasidan yog' foizini hisoblang")}
              </Muted>
            </View>
            <Icon name="chevronR" color={t.faint} />
          </Row>
        </Card>
      </Pressable>

      <Pressable onPress={onPhotos} accessibilityRole="button">
        <Card>
          <Row style={{ gap: 12 }}>
            {state.photos.length > 0 ? (
              <Image source={{ uri: state.photos[state.photos.length - 1]!.uri }} style={{ width: 44, height: 58, borderRadius: 10 }} />
            ) : (
              <IconTile>
                <Icon name="camera" size={20} color={t.accentStrong} />
              </IconTile>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>{tr("Progress fotolar")}</Text>
              <Muted style={{ fontSize: 13 }}>
                {state.photos.length ? tr("{n} ta rasm · oldin va keyin solishtirish", { n: state.photos.length }) : tr("Tarozi ko'rsatmaydigan o'zgarishni rasm ko'rsatadi")}
              </Muted>
            </View>
            <Icon name="chevronR" color={t.faint} />
          </Row>
        </Card>
      </Pressable>

      <Card>
        <H2>{tr("Vazn")}</H2>
        {weights.length > 0 ? (
          <>
            <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
              {tPts.length > 1 && <Polyline points={tPts.join(" ")} fill="none" stroke={t.accent} strokeWidth={3} strokeLinejoin="round" />}
              {pts.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={3.5} fill={t.card} stroke={t.faint} strokeWidth={1.5} />
              ))}
            </Svg>
            <Muted style={{ fontSize: 12 }}>{tr("Chiziq: kunlik suv tebranishlarini tekislagan haqiqiy trend. Nuqtalar: tarozi.")}</Muted>
            {first && last && (
              <Muted>
                {first.kg} → {last.kg} kg ({last.kg - first.kg > 0 ? "+" : ""}
                {Math.round((last.kg - first.kg) * 10) / 10} kg)
              </Muted>
            )}
          </>
        ) : (
          <Muted>{tr("Hali vazn yozilmagan.")}</Muted>
        )}
        <Row style={{ gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Input value={w} onChangeText={setW} keyboardType="decimal-pad" placeholder={tr("Bugungi vazn, kg")} />
          </View>
          <Button
            title={tr("Saqlash")}
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
