import { useEffect } from "react";
import { Platform } from "react-native";
import { Pedometer } from "expo-sensors";

/**
 * Keeps today's step count in the diary while the app is open.
 * iOS: reads today's total from Core Motion, then follows live steps.
 * Android: counts live steps on top of what is already saved (no history API without Health Connect).
 */
export function useStepCounter(day: string, saved: number, onSteps: (steps: number) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (!(await Pedometer.isAvailableAsync())) return;
        const perm = await Pedometer.requestPermissionsAsync();
        if (!perm.granted || cancelled) return;
        let base = saved;
        if (Platform.OS === "ios") {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const r = await Pedometer.getStepCountAsync(start, new Date());
          base = Math.max(saved, r.steps);
          onSteps(base);
        }
        sub = Pedometer.watchStepCount((r) => onSteps(base + r.steps));
      } catch {
        /* sensor not available: manual entry still works */
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, enabled]);
}
