import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button, Card, H1, Muted } from "../components/ui";
import { targetsOf } from "../diary";
import { useDiary } from "../store";
import { useTheme } from "../theme";
import { ProfileForm } from "./Onboarding";

const BMI: Record<string, string> = { underweight: "vazn kam", normal: "normal", overweight: "ortiqcha vazn", obese: "semizlik" };

export default function ProfileScreen({ onMyFoods }: { onMyFoods: () => void }) {
  const t = useTheme();
  const { state, dispatch } = useDiary();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tg = targetsOf(state);

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
      <Button kind="ghost" title={`⭐ Mahsulotlarim (${state.customFoods.length})`} onPress={onMyFoods} />
      <Card>
        <Muted>Barcha ma'lumotlar faqat shu telefonda saqlanadi.</Muted>
        <Text style={{ height: 10 }} />
        <Button
          kind="ghost"
          title={confirmReset ? "Rostdan ham hammasini o'chiraymi? Bosing" : "Ma'lumotlarni tozalash"}
          onPress={() => (confirmReset ? dispatch({ type: "reset" }) : setConfirmReset(true))}
        />
      </Card>
    </ScrollView>
  );
}
