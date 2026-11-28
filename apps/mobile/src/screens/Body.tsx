import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import type { FatCategory, Measurements, Risk } from "@ozginbol/core";
import { FAT_CATEGORY_BOUNDS, FAT_CATEGORY_LABELS, MEASURE_TIPS, RISK_LABELS, bodyComposition, measurementError } from "@ozginbol/core";
import { Button, Card, Eyebrow, Field, H1, H2, Icon, Input, Muted, Ring, Row, Stat } from "../components/ui";
import { dayKey } from "../diary";
import { useDiary, useT } from "../store";
import { useTheme, type Theme } from "../theme";

const SCALE = { male: [2, 40], female: [10, 48] } as const;

function bandColor(t: Theme, c: FatCategory): string {
  return { essential: t.protein, athlete: t.accentStrong, fitness: t.accent, average: t.fat, obese: t.warn }[c];
}
function riskColor(t: Theme, r: Risk): string {
  return r === "low" ? t.accent : r === "increased" ? t.fat : t.danger;
}

export default function Body({ onClose }: { onClose?: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr } = useT();
  const p = state.profile!;
  const hist = state.measurements;
  const last = hist[hist.length - 1];
  const [neck, setNeck] = useState(last ? String(last.neckCm) : "");
  const [waist, setWaist] = useState(last ? String(last.waistCm) : "");
  const [hip, setHip] = useState(last?.hipCm ? String(last.hipCm) : "");
  const [weight, setWeight] = useState(String(p.weightKg));
  const [saved, setSaved] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const n = (s: string) => parseFloat(s.replace(",", "."));
  const m: Measurements = {
    sex: p.sex,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: n(weight),
    neckCm: n(neck),
    waistCm: n(waist),
    hipCm: hip ? n(hip) : undefined,
  };
  const filled = neck !== "" && waist !== "" && (p.sex === "male" || hip !== "");
  const error = filled ? (m.weightKg >= 30 && m.weightKg <= 300 ? measurementError(m) : "Vazn 30-300 kg oralig'ida bo'lsin") : null;
  const b = useMemo(() => (filled && !error ? bodyComposition(m) : null), [filled, error, neck, waist, hip, weight]); // eslint-disable-line react-hooks/exhaustive-deps

  const [lo, hi] = SCALE[p.sex];
  const bands = FAT_CATEGORY_BOUNDS[p.sex].map(([cat, max], i, arr) => ({ cat, w: (Math.min(max, hi) - (i === 0 ? lo : arr[i - 1]![1])) / (hi - lo) }));

  const save = () => {
    if (!b) return;
    dispatch({ type: "measure", m: { day: dayKey(), neckCm: m.neckCm, waistCm: m.waistCm, hipCm: m.hipCm, weightKg: m.weightKg, bodyFatPct: b.bodyFatPct } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const series = hist.slice(-12);
  const sMin = Math.min(...series.map((x) => x.bodyFatPct)) - 0.5;
  const sMax = Math.max(...series.map((x) => x.bodyFatPct)) + 0.5;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Row style={{ justifyContent: "space-between" }}>
        <View>
          <Eyebrow>{tr("Tana tarkibi")}</Eyebrow>
          <H1>{tr("Yog' foizi")}</H1>
        </View>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={tr("Yopish")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.card, alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" color={t.muted} />
          </Pressable>
        )}
      </Row>

      <Card style={{ gap: 12 }}>
        <Muted>{tr("Santimetr lenta bilan o'lchang. Bo'y ({h} sm) va jins profildan olinadi.", { h: p.heightCm })}</Muted>
        <Row style={{ gap: 10 }}>
          <Field label={tr("Bo'yin, sm")}>
            <Input value={neck} onChangeText={setNeck} keyboardType="decimal-pad" placeholder="38" />
          </Field>
          <Field label={tr("Bel, sm")}>
            <Input value={waist} onChangeText={setWaist} keyboardType="decimal-pad" placeholder="85" />
          </Field>
        </Row>
        <Row style={{ gap: 10 }}>
          {p.sex === "female" && (
            <Field label={tr("Son, sm")}>
              <Input value={hip} onChangeText={setHip} keyboardType="decimal-pad" placeholder="98" />
            </Field>
          )}
          <Field label={tr("Vazn, kg")}>
            <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
          </Field>
          {p.sex === "male" && <View style={{ flex: 1 }} />}
        </Row>
        <View style={{ backgroundColor: t.card2, borderRadius: 16, padding: 12, gap: 6 }}>
          {MEASURE_TIPS.filter((x) => x.key !== "hip" || p.sex === "female").map((x) => (
            <Text key={x.key} style={{ color: t.muted, fontSize: 13, lineHeight: 18 }}>
              <Text style={{ color: t.text, fontWeight: "800" }}>{tr(x.label)}: </Text>
              {tr(x.tip)}
            </Text>
          ))}
        </View>
      </Card>

      {error && (
        <View style={{ backgroundColor: t.warnSoft, borderRadius: 16, padding: 14 }}>
          <Text style={{ color: t.warn, fontWeight: "600" }}>{tr(error)}</Text>
        </View>
      )}

      {b && (
        <Card style={{ gap: 16 }}>
          <Row style={{ gap: 16 }}>
            <Ring value={b.bodyFatPct} max={hi} size={124} stroke={12} color={bandColor(t, b.category)}>
              <Text style={{ color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>{b.bodyFatPct}%</Text>
              <Text style={{ color: t.muted, fontSize: 11, fontWeight: "700" }}>{tr("yog'")}</Text>
            </Ring>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}>{tr(FAT_CATEGORY_LABELS[b.category])}</Text>
              <Muted style={{ fontSize: 13, marginTop: 4 }}>
                {tr("Sog'lom oraliq: {a}-{b}%", { a: b.healthyRange[0], b: b.healthyRange[1] })}
                {b.bmiEstimatePct !== undefined ? `\n${tr("TMI bo'yicha taxmin: {n}%", { n: b.bmiEstimatePct })}` : ""}
              </Muted>
            </View>
          </Row>

          <View>
            <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", gap: 2 }}>
              {bands.map((x) => (
                <View key={x.cat} style={{ flex: x.w, backgroundColor: bandColor(t, x.cat) }} />
              ))}
            </View>
            <View
              style={{
                position: "absolute",
                top: -6,
                left: `${Math.max(0, Math.min(100, ((b.bodyFatPct - lo) / (hi - lo)) * 100))}%`,
                marginLeft: -2,
                width: 4,
                height: 22,
                borderRadius: 2,
                backgroundColor: t.text,
                borderWidth: 1,
                borderColor: t.card,
              }}
            />
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: t.faint, fontSize: 11, fontWeight: "700" }}>{lo}%</Text>
              <Text style={{ color: t.faint, fontSize: 11, fontWeight: "700" }}>{hi}%</Text>
            </Row>
          </View>

          <Row style={{ gap: 8, alignItems: "stretch" }}>
            <Stat value={`${b.fatMassKg} kg`} label={tr("yog' massasi")} />
            <Stat value={`${b.leanMassKg} kg`} label={tr("yog'siz massa")} />
            <Stat value={b.waistToHeight.toFixed(2)} label={`${tr("bel ÷ bo'y")} · ${tr(RISK_LABELS[b.whtrRisk])}`} tone={riskColor(t, b.whtrRisk)} />
          </Row>
          <Muted style={{ fontSize: 13 }}>
            {tr("Bel bo'yicha yurak-qon tomir xavfi")}: <Text style={{ color: riskColor(t, b.waistRisk), fontWeight: "800" }}>{tr(RISK_LABELS[b.waistRisk])}</Text>
          </Muted>

          <Pressable onPress={() => setShowSteps(!showSteps)} style={{ backgroundColor: t.card2, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: t.text, fontWeight: "800" }}>{showSteps ? "▾" : "▸"} {tr("Qanday hisoblandi (US Navy usuli)")}</Text>
            {showSteps &&
              b.steps.map((s, i) => (
                <Text key={s} style={{ color: t.muted, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
                  {i + 1}. {tr(s)}
                </Text>
              ))}
          </Pressable>

          <Button title={saved ? tr("Saqlandi ✓") : tr("O'lchovni saqlash")} onPress={save} />
          <Muted style={{ fontSize: 12, textAlign: "center" }}>{tr("Saqlansa, kunlik me'yor yog' foizi bilan (Katch-McArdle) aniqroq hisoblanadi.")}</Muted>
        </Card>
      )}

      {hist.length > 0 && (
        <Card>
          <H2>{tr("O'lchovlar tarixi")}</H2>
          {series.length > 1 && (
            <Svg width="100%" height={70} viewBox="0 0 300 70" preserveAspectRatio="none">
              <Polyline
                points={series.map((x, i) => `${(i / (series.length - 1)) * 290 + 5},${64 - ((x.bodyFatPct - sMin) / (sMax - sMin)) * 58}`).join(" ")}
                fill="none"
                stroke={t.accent}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Svg>
          )}
          {hist
            .slice(-8)
            .reverse()
            .map((h, i, arr) => {
              const prev = arr[i + 1];
              const d = prev ? Math.round((h.bodyFatPct - prev.bodyFatPct) * 10) / 10 : 0;
              return (
                <Row key={h.day} style={{ justifyContent: "space-between", paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}>
                  <View>
                    <Text style={{ color: t.text, fontWeight: "700" }}>{h.day.slice(5).split("-").reverse().join(".")}</Text>
                    <Muted style={{ fontSize: 12 }}>
                      {tr("bel")} {h.waistCm} · {tr("bo'yin")} {h.neckCm}
                      {h.hipCm ? ` · ${tr("son")} ${h.hipCm}` : ""} · {h.weightKg} kg
                    </Muted>
                  </View>
                  <Row style={{ gap: 10 }}>
                    {d !== 0 && <Text style={{ color: d < 0 ? t.accent : t.warn, fontWeight: "800", fontSize: 13 }}>{d > 0 ? `+${d}` : d}</Text>}
                    <Text style={{ color: t.text, fontWeight: "800", fontSize: 16 }}>{h.bodyFatPct}%</Text>
                    <Pressable onPress={() => dispatch({ type: "removeMeasure", day: h.day })} hitSlop={8} accessibilityLabel={tr("O'chirish")}>
                      <Icon name="trash" size={18} color={t.faint} />
                    </Pressable>
                  </Row>
                </Row>
              );
            })}
        </Card>
      )}
    </ScrollView>
  );
}
