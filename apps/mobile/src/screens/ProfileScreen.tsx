import { useState } from "react";
import { Share, ScrollView, Switch, Text, View } from "react-native";
import { LANGS, translator } from "@ozginbol/core";
import { Button, Card, H1, Icon, IconTile, Muted, Row, Segmented } from "../components/ui";
import { targetsOf, toCsv } from "../diary";
import { deleteAllPhotoFiles } from "../photos";
import { setDailyReminders } from "../reminders";
import { useDiary, useT } from "../store";
import { useTheme } from "../theme";
import { ProfileForm } from "./Onboarding";

const BMI: Record<string, string> = { underweight: "vazn kam", normal: "normal", overweight: "ortiqcha vazn", obese: "semizlik" };

export default function ProfileScreen({ onMyFoods, onBody, onPhotos }: { onMyFoods: () => void; onBody: () => void; onPhotos: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const { tr, lang } = useT();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tg = targetsOf(state);
  const [remMsg, setRemMsg] = useState<string | null>(null);
  const toggleReminders = async (on: boolean) => {
    const ok = await setDailyReminders(on, tr);
    if (ok) dispatch({ type: "settings", patch: { reminders: on } });
    setRemMsg(ok ? null : tr("Telefon bildirishnomaga ruxsat bermadi (yoki bu brauzer versiyasi)."));
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <H1>{tr("Profil")}</H1>
      <Card style={{ gap: 10 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: "800" }}>Til · Язык · Language</Text>
        <Segmented value={lang} onChange={(v) => {
            dispatch({ type: "settings", patch: { lang: v } });
            if (state.settings.reminders) void setDailyReminders(true, translator(v));
          }} options={LANGS.map((l) => ({ id: l.id, label: l.label }))} />
      </Card>
      {tg && (
        <Card>
          <Text style={{ color: t.text, fontSize: 15 }}>
            {tr("TMI {bmi} ({cat}) · tinch holatda {bmr} kkal · faollik bilan {tdee} kkal", { bmi: tg.bmi, cat: tr(BMI[tg.bmiCategory]!), bmr: tg.bmr, tdee: tg.tdee })}
          </Text>
        </Card>
      )}
      <Card>
        <ProfileForm
          key={JSON.stringify(state.profile)}
          initial={state.profile}
          cta={saved ? tr("Saqlandi ✓") : tr("Saqlash")}
          onDone={(p) => {
            dispatch({ type: "setProfile", profile: p });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
        />
      </Card>
      <Button kind="ghost" icon={<Icon name="ruler" size={18} color={t.text} />} title={state.profile?.bodyFatPct ? `${tr("Yog' foizi")}: ${state.profile.bodyFatPct}%` : tr("Yog' foizini o'lchash")} onPress={onBody} />
      <Button kind="ghost" icon={<Icon name="star" size={18} color={t.text} />} title={`${tr("Mahsulotlarim")} (${state.customFoods.length})`} onPress={onMyFoods} />
      <Button kind="ghost" icon={<Icon name="camera" size={18} color={t.text} />} title={`${tr("Progress fotolar")} (${state.photos.length})`} onPress={onPhotos} />
      <Card style={{ gap: 12 }}>
        <Row style={{ gap: 12 }}>
          <IconTile>
            <Icon name="bell" size={20} color={t.accentStrong} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: "800" }}>{tr("Eslatmalar")}</Text>
            <Muted style={{ fontSize: 13 }}>{tr("Nonushta 8:30, tushlik 13:15, kechki 19:30, suv 11:00 va 16:00")}</Muted>
          </View>
          <Switch value={state.settings.reminders} onValueChange={(v) => void toggleReminders(v)} />
        </Row>
        {remMsg && <Text style={{ color: t.warn, fontSize: 13 }}>{remMsg}</Text>}
        <Button
          kind="ghost"
          icon={<Icon name="share" size={18} color={t.text} />}
          title={tr("Kundalikni eksport qilish (CSV)")}
          disabled={!state.entries.length}
          onPress={() => void Share.share({ title: tr("Ozginbol kundalik"), message: toCsv(state) })}
        />
      </Card>
      <Card>
        <Muted>{tr("Barcha ma'lumotlar faqat shu telefonda saqlanadi.")}</Muted>
        <Text style={{ height: 10 }} />
        <Button
          kind="danger"
          title={confirmReset ? tr("Rostdan ham hammasini o'chiraymi? Bosing") : tr("Ma'lumotlarni tozalash")}
          onPress={() => {
            if (!confirmReset) return setConfirmReset(true);
            void deleteAllPhotoFiles();
            dispatch({ type: "reset" });
          }}
        />
      </Card>
    </ScrollView>
  );
}
