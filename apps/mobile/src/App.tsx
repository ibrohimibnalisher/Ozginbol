import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { dayKey, mealForHour, type MealType } from "./diary";
import { DiaryProvider, useDiary } from "./store";
import { useTheme } from "./theme";
import AddFood from "./screens/AddFood";
import MyFoods from "./screens/MyFoods";
import Onboarding from "./screens/Onboarding";
import ProfileScreen from "./screens/ProfileScreen";
import Progress from "./screens/Progress";
import Today from "./screens/Today";
import Training from "./screens/Training";

type Tab = "today" | "progress" | "training" | "profile";

const TABS: { id: Tab | "add"; icon: string; label: string }[] = [
  { id: "today", icon: "🏠", label: "Bugun" },
  { id: "progress", icon: "📊", label: "Hisobot" },
  { id: "add", icon: "+", label: "" },
  { id: "training", icon: "🏃", label: "Mashq" },
  { id: "profile", icon: "👤", label: "Profil" },
];

function Shell() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, dispatch, ready } = useDiary();
  const [tab, setTab] = useState<Tab>("today");
  const [day, setDay] = useState(dayKey());
  const [adding, setAdding] = useState<MealType | null>(null);
  const [myFoods, setMyFoods] = useState(false);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.bg }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }
  if (!state.profile) return <Onboarding onDone={(p) => dispatch({ type: "setProfile", profile: p })} />;

  const openAdd = (meal?: MealType) => {
    setMyFoods(false);
    setTab("today");
    setAdding(meal ?? mealForHour(new Date().getHours()));
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1 }}>
        {myFoods ? (
          <MyFoods onClose={() => setMyFoods(false)} />
        ) : adding ? (
          <AddFood day={day} meal={adding} onClose={() => setAdding(null)} onMyFoods={() => setMyFoods(true)} />
        ) : tab === "today" ? (
          <Today day={day} setDay={setDay} onAdd={openAdd} />
        ) : tab === "progress" ? (
          <Progress />
        ) : tab === "training" ? (
          <Training />
        ) : (
          <ProfileScreen onMyFoods={() => setMyFoods(true)} />
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: t.card,
          borderTopColor: t.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        }}
      >
        {TABS.map((x) =>
          x.id === "add" ? (
            <View key="add" style={{ flex: 1, alignItems: "center" }}>
              <Pressable
                onPress={() => openAdd()}
                accessibilityLabel="Ovqat qo'shish"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  marginTop: -24,
                  backgroundColor: t.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Text style={{ color: t.accentInk, fontSize: 32, fontWeight: "600", lineHeight: 36 }}>+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={x.id}
              onPress={() => {
                setAdding(null);
                setMyFoods(false);
                setTab(x.id as Tab);
              }}
              style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === x.id && !adding }}
            >
              <Text style={{ fontSize: 20, opacity: tab === x.id && !adding ? 1 : 0.5 }}>{x.icon}</Text>
              <Text style={{ fontSize: 11, color: tab === x.id && !adding ? t.text : t.muted, fontWeight: "600" }}>{x.label}</Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

export default function App() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "left", "right"]}>
        <StatusBar style="auto" />
        <DiaryProvider>
          <Shell />
        </DiaryProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
