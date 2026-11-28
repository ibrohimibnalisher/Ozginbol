import { useColorScheme } from "react-native";

// Same tokens as the website (apps/web/app/globals.css), so both feel like one product.
const light = {
  bg: "#f4f6f4",
  card: "#ffffff",
  card2: "#f1f4f1",
  card3: "#e8ede9",
  text: "#0e1a14",
  muted: "#5f6e66",
  faint: "#8a978f",
  border: "#e2e8e3",
  accent: "#12a150",
  accentStrong: "#0b7f3d",
  accentInk: "#ffffff",
  accentSoft: "#e2f5e9",
  protein: "#3b82f6",
  fat: "#f59e0b",
  carbs: "#e0487a",
  water: "#0ea5e9",
  warn: "#c2410c",
  warnSoft: "#fff1e6",
  danger: "#dc2626",
  hero: "#0b2a19",
  hero2: "#06180f",
  heroText: "#f2fbf5",
  heroMuted: "#a9c7b5",
  heroAccent: "#2bd177",
  shadow: "#10181418",
};

const dark: typeof light = {
  bg: "#080d0a",
  card: "#111813",
  card2: "#172019",
  card3: "#1f2a22",
  text: "#ecf3ee",
  muted: "#97a79d",
  faint: "#6d7c73",
  border: "#222d26",
  accent: "#2bd177",
  accentStrong: "#5fe39a",
  accentInk: "#04110a",
  accentSoft: "#12301f",
  protein: "#6aa6ff",
  fat: "#fbbf24",
  carbs: "#ff7aa5",
  water: "#38bdf8",
  warn: "#fb923c",
  warnSoft: "#2a1a0e",
  danger: "#f87171",
  hero: "#0b2a19",
  hero2: "#050a07",
  heroText: "#f2fbf5",
  heroMuted: "#a9c7b5",
  heroAccent: "#2bd177",
  shadow: "#00000000",
};

export type Theme = typeof light & { dark: boolean };

export function useTheme(): Theme {
  const d = useColorScheme() === "dark";
  return { ...(d ? dark : light), dark: d };
}

export const radius = 22;
