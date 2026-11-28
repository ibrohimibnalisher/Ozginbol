import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { dayKey, mealForHour, type MealType } from "./diary";
import { DiaryProvider, useDiary } from "./store";
import { useTheme } from "./theme";
import { Icon, type IconName } from "./components/ui";
import AddFood from "./screens/AddFood";
import Body from "./screens/Body";
import MyFoods from "./screens/MyFoods";
import Onboarding from "./screens/Onboarding";
import ProfileScreen from "./screens/ProfileScreen";
import Progress from "./screens/Progress";
import Today from "./screens/Today";
import Training from "./screens/Training";

type Tab = "today" | "progress" | "training" | "profile";

const TABS: { id: Tab | "add"; icon: IconName; label: string }[] = [
  { id: "today", icon: "home", label: "Bugun" },
  { id: "progress", icon: "chart", label: "Hisobot" },
  { id: "add", icon: "plus", label: "" },
  { id: "training", icon: "run", label: "Mashq" },
  { id: "profile", icon: "user", label: "Profil" },
];

function Shell() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, dispatch, ready } = useDiary();
  const [tab, setTab] = useState<Tab>("today");
  const [day, setDay] = useState(dayKey());
  const [adding, setAdding] = useState<MealType | null>(null);
  const [myFoods, setMyFoods] = useState(false);
  const [body, setBody] = useState(false);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.bg }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }
  if (!state.profile) return <Onboarding onDone={(p) => dispatch({ type: "setProfile", profile: p })} />;

  const on = (id: string) => tab === id && !adding && !myFoods && !body;
  const openAdd = (meal?: MealType) => {
    setMyFoods(false);
    setBody(false);
    setTab("today");
    setAdding(meal ?? mealForHour(new Date().getHours()));
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1 }}>
        {body ? (
          <Body onClose={() => setBody(false)} />
        ) : myFoods ? (
          <MyFoods onClose={() => setMyFoods(false)} />
        ) : adding ? (
          <AddFood day={day} meal={adding} onClose={() => setAdding(null)} onMyFoods={() => setMyFoods(true)} />
        ) : tab === "today" ? (
          <Today day={day} setDay={setDay} onAdd={openAdd} />
        ) : tab === "progress" ? (
          <Progress onBody={() => setBody(true)} />
        ) : tab === "training" ? (
          <Training />
        ) : (
          <ProfileScreen onMyFoods={() => setMyFoods(true)} onBody={() => setBody(true)} />
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: t.card,
          borderTopColor: t.border,
          borderTopWidth: t.dark ? 1 : 0,
          shadowColor: "#0b1a12",
          shadowOpacity: t.dark ? 0 : 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
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
                  shadowColor: t.accent,
                  shadowOpacity: 0.45,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Icon name="plus" size={28} color={t.accentInk} stroke={2.8} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={x.id}
              onPress={() => {
                setAdding(null);
                setMyFoods(false);
                setBody(false);
                setTab(x.id as Tab);
              }}
              style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on(x.id) }}
            >
              <Icon name={x.icon} size={24} color={on(x.id) ? t.accent : t.faint} stroke={on(x.id) ? 2.4 : 2} />
              <Text style={{ fontSize: 11, marginTop: 3, color: on(x.id) ? t.text : t.faint, fontWeight: on(x.id) ? "800" : "600" }}>{x.label}</Text>
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
