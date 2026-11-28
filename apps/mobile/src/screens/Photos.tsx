import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { monthDay } from "@ozginbol/core";
import { Button, Card, Eyebrow, H1, H2, Icon, Muted, Row, Segmented } from "../components/ui";
import { dayKey, photoPair, weightOn, type Pose, type ProgressPhoto } from "../diary";
import { deletePhotoFile, pickPhoto, type PhotoSource } from "../photos";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";

const POSES: { id: Pose; label: string }[] = [
  { id: "front", label: "Old" },
  { id: "side", label: "Yon" },
  { id: "back", label: "Orqa" },
];

export default function Photos({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr, lang } = useT();
  const [pose, setPose] = useState<Pose>("front");
  const [pick, setPick] = useState<{ before?: string; after?: string }>({});
  const [slot, setSlot] = useState<"before" | "after">("after");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = state.photos.filter((p) => p.pose === pose);
  const pair = photoPair(state, pose, pick.before, pick.after);
  const date = (day: string) => {
    const [, m, d] = day.split("-").map(Number) as [number, number, number];
    return monthDay(d, m, lang);
  };

  const add = async (from: PhotoSource) => {
    setMsg(null);
    setBusy(true);
    try {
      const uri = await pickPhoto(from);
      if (uri === "denied") setMsg(tr("Kameraga ruxsat berilmadi. Telefon sozlamalaridan ruxsat bering."));
      else if (uri) {
        const day = dayKey();
        const kg = weightOn(state, day);
        dispatch({ type: "addPhoto", photo: { day, uri, pose, ...(kg !== undefined ? { weightKg: kg } : {}) } });
        setPick({});
      }
    } catch {
      setMsg(tr("Rasmni saqlab bo'lmadi."));
    } finally {
      setBusy(false);
    }
  };

  const remove = (p: ProgressPhoto) => {
    dispatch({ type: "removePhoto", id: p.id });
    void deletePhotoFile(p.uri);
    setPick({});
  };

  const frame = (p: ProgressPhoto | undefined, title: string) => (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ color: t.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 }}>{title}</Text>
      <View style={{ aspectRatio: 3 / 4, borderRadius: 18, overflow: "hidden", backgroundColor: t.card2, alignItems: "center", justifyContent: "center" }}>
        {p ? <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <Icon name="camera" size={28} color={t.faint} />}
      </View>
      {p && (
        <Text style={{ color: t.text, fontWeight: "800", fontSize: 13 }}>
          {date(p.day)}
          {p.weightKg !== undefined ? <Text style={{ color: t.muted, fontWeight: "600" }}> · {p.weightKg} kg</Text> : null}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <View>
          <Eyebrow>{tr("Oldin va keyin")}</Eyebrow>
          <H1>{tr("Progress fotolar")}</H1>
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={tr("Yopish")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.card, alignItems: "center", justifyContent: "center" }}>
          <Icon name="close" color={t.muted} />
        </Pressable>
      </Row>

      <Segmented value={pose} onChange={(v) => { setPose(v); setPick({}); }} options={POSES.map((p) => ({ id: p.id, label: tr(p.label) }))} />

      <Card style={{ gap: 12 }}>
        <Row style={{ gap: 12, alignItems: "flex-start" }}>
          {frame(pair.before, tr("Oldin"))}
          {frame(pair.after, tr("Keyin"))}
        </Row>
        {pair.before && pair.after ? (
          <Row style={{ gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: t.card2, borderRadius: 14, padding: 10 }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: "800" }}>{pair.days}</Text>
              <Muted style={{ fontSize: 12 }}>{tr("kun o'tdi")}</Muted>
            </View>
            <View style={{ flex: 1, backgroundColor: t.card2, borderRadius: 14, padding: 10 }}>
              <Text style={{ color: pair.kg === null ? t.text : pair.kg <= 0 ? t.accent : t.warn, fontSize: 18, fontWeight: "800" }}>
                {pair.kg === null ? "—" : `${pair.kg > 0 ? "+" : ""}${pair.kg} kg`}
              </Text>
              <Muted style={{ fontSize: 12 }}>{tr("vazn o'zgarishi")}</Muted>
            </View>
          </Row>
        ) : (
          <Muted style={{ fontSize: 13 }}>
            {list.length === 0
              ? tr("Birinchi rasmni hozir oling. Har 2-4 haftada bir xil joyda, bir xil yorug'likda va bir xil pozada oling.")
              : tr("Solishtirish uchun yana bitta rasm kerak.")}
          </Muted>
        )}
      </Card>

      <Row style={{ gap: 10 }}>
        {Platform.OS !== "web" && (
          <View style={{ flex: 1 }}>
            <Button title={tr("Rasmga olish")} icon={<Icon name="camera" size={18} color={t.accentInk} />} onPress={() => void add("camera")} disabled={busy} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Button kind={Platform.OS === "web" ? "primary" : "ghost"} title={tr("Galereyadan")} onPress={() => void add("library")} disabled={busy} />
        </View>
      </Row>
      {msg && <Text style={{ color: t.warn, fontSize: 13 }}>{msg}</Text>}

      {list.length > 0 && (
        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <H2 style={{ marginBottom: 0 }}>{tr("Tarix")}</H2>
            <Muted>{list.length}</Muted>
          </Row>
          {list.length > 1 && (
            <Segmented
              value={slot}
              onChange={setSlot}
              options={[
                { id: "before", label: tr("Oldin rasmini tanlash") },
                { id: "after", label: tr("Keyin rasmini tanlash") },
              ]}
            />
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[...list].reverse().map((p) => {
              const role = p.id === pair.before?.id ? tr("Oldin") : p.id === pair.after?.id ? tr("Keyin") : null;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPick((x) => ({ ...x, [slot]: p.id }))}
                  accessibilityLabel={date(p.day)}
                  style={{ width: "31%", flexGrow: 1, maxWidth: "33%", gap: 4 }}
                >
                  <View style={{ aspectRatio: 3 / 4, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: role ? t.accent : "transparent" }}>
                    <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    {role && (
                      <View style={{ position: "absolute", left: 6, top: 6, backgroundColor: t.accent, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: t.accentInk, fontSize: 10, fontWeight: "800" }}>{role}</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => remove(p)}
                      hitSlop={6}
                      accessibilityLabel={tr("O'chirish")}
                      style={{ position: "absolute", right: 6, top: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}
                    >
                      <Icon name="trash" size={14} color="#fff" />
                    </Pressable>
                  </View>
                  <Text style={{ color: t.muted, fontSize: 11, fontWeight: "700" }}>
                    {date(p.day)}
                    {p.weightKg !== undefined ? ` · ${p.weightKg} kg` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}

      <Row style={{ gap: 10, alignItems: "flex-start", paddingHorizontal: 4 }}>
        <Icon name="user" size={16} color={t.faint} />
        <Muted style={{ fontSize: 12, flex: 1 }}>{tr("Rasmlar faqat shu telefonda saqlanadi va hech qayerga yuborilmaydi.")}</Muted>
      </Row>
    </ScrollView>
  );
}
