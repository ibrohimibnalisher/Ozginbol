import { useState } from "react";
import { Share, ScrollView, Switch, Text, View } from "react-native";
import { Button, Card, H1, Icon, IconTile, Muted, Row } from "../components/ui";
import { targetsOf, toCsv } from "../diary";
import { setDailyReminders } from "../reminders";
import { useDiary } from "../store";
import { useTheme } from "../theme";
import { ProfileForm } from "./Onboarding";

const BMI: Record<string, string> = { underweight: "vazn kam", normal: "normal", overweight: "ortiqcha vazn", obese: "semizlik" };

export default function ProfileScreen({ onMyFoods, onBody }: { onMyFoods: () => void; onBody: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tg = targetsOf(state);
  const [remMsg, setRemMsg] = useState<string | null>(null);
  const toggleReminders = async (on: boolean) => {
    const ok = await setDailyReminders(on);
    if (ok) dispatch({ type: "settings", patch: { reminders: on } });
    setRemMsg(ok ? null : "Telefon bildirishnomaga ruxsat bermadi (yoki bu brauzer versiyasi).");
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }} keyboardShouldPersistTaps="handled">
      <H1>Profil</H1>
      {tg && (
        <Card>
          <Text style={{ color: t.text, fontSize: 15 }}>
            TMI {tg.bmi} ({BMI[tg.bmiCategory]}) · tinch holatda {tg.bmr} kkal · faollik bilan {tg.tdee} kkal
          </Text>
        </Card>
      )}
      <Card>
        <ProfileForm
          key={JSON.stringify(state.profile)}
          initial={state.profile}
          cta={saved ? "Saqlandi ✓" : "Saqlash"}
          onDone={(p) => {
            dispatch({ type: "setProfile", profile: p });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
        />
      </Card>
      <Button kind="ghost" icon={<Icon name="ruler" size={18} color={t.text} />} title={state.profile?.bodyFatPct ? `Yog' foizi: ${state.profile.bodyFatPct}%` : "Yog' foizini o'lchash"} onPress={onBody} />
      <Button kind="ghost" icon={<Icon name="star" size={18} color={t.text} />} title={`Mahsulotlarim (${state.customFoods.length})`} onPress={onMyFoods} />
      <Card style={{ gap: 12 }}>
        <Row style={{ gap: 12 }}>
          <IconTile>
            <Icon name="bell" size={20} color={t.accentStrong} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: "800" }}>Eslatmalar</Text>
            <Muted style={{ fontSize: 13 }}>Nonushta 8:30, tushlik 13:15, kechki 19:30, suv 11:00 va 16:00</Muted>
          </View>
          <Switch value={state.settings.reminders} onValueChange={(v) => void toggleReminders(v)} />
        </Row>
        {remMsg && <Text style={{ color: t.warn, fontSize: 13 }}>{remMsg}</Text>}
        <Button
          kind="ghost"
          icon={<Icon name="share" size={18} color={t.text} />}
          title="Kundalikni eksport qilish (CSV)"
          disabled={!state.entries.length}
          onPress={() => void Share.share({ title: "Ozginbol kundalik", message: toCsv(state) })}
        />
      </Card>
      <Card>
        <Muted>Barcha ma'lumotlar faqat shu telefonda saqlanadi.</Muted>
        <Text style={{ height: 10 }} />
        <Button
          kind="danger"
          title={confirmReset ? "Rostdan ham hammasini o'chiraymi? Bosing" : "Ma'lumotlarni tozalash"}
          onPress={() => (confirmReset ? dispatch({ type: "reset" }) : setConfirmReset(true))}
        />
      </Card>
    </ScrollView>
  );
}
