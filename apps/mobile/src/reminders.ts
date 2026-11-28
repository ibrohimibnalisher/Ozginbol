import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const DAILY: [hour: number, minute: number, title: string, body: string][] = [
  [8, 30, "Nonushta", "Nonushtani yozib qo'ying: bir gap bilan, masalan \"2 ta tuxum va choy\"."],
  [11, 0, "Suv", "Bir stakan suv iching 💧"],
  [13, 15, "Tushlik", "Tushlikda nima yedingiz? Yozib qo'ying."],
  [16, 0, "Suv", "Suv me'yorini tekshiring 💧"],
  [19, 30, "Kechki ovqat", "Kechki ovqatni yozing va kunlik bahoni ko'ring."],
];

async function permitted(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  if (!req.granted) return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", { name: "Eslatmalar", importance: Notifications.AndroidImportance.DEFAULT });
  }
  return true;
}

/** Turns the daily meal and water reminders on or off. Returns false if the phone did not allow notifications. */
export async function setDailyReminders(on: boolean): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((n) => n.content.data?.kind === "daily").map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!on) return true;
  if (!(await permitted())) return false;
  for (const [hour, minute, title, body] of DAILY) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { kind: "daily" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
  return true;
}

/** Notifies when a fast reaches its goal. */
export async function scheduleFastEnd(at: number): Promise<void> {
  if (Platform.OS === "web" || at <= Date.now()) return;
  await cancelFastEnd();
  if (!(await permitted())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: "Ochlik yakunlandi 🎉", body: "Maqsadga yetdingiz. Ovqatni yengil, oqsilli taomdan boshlang.", data: { kind: "fast" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
  });
}

export async function cancelFastEnd(): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((n) => n.content.data?.kind === "fast").map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
