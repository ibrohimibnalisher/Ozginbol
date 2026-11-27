import { useColorScheme } from "react-native";

const light = {
  bg: "#f6f8f4",
  card: "#ffffff",
  card2: "#eef2ea",
  text: "#17201a",
  muted: "#5d6b60",
  border: "#dde4d8",
  accent: "#1f9d55",
  accentInk: "#ffffff",
  accentSoft: "#dff3e6",
  protein: "#2f7de1",
  fat: "#d9950f",
  carbs: "#d2556a",
  water: "#2a9fd6",
  warn: "#b4540a",
};

const dark: typeof light = {
  bg: "#101410",
  card: "#182019",
  card2: "#1f2a21",
  text: "#e8efe9",
  muted: "#9aab9e",
  border: "#2b382d",
  accent: "#34c172",
  accentInk: "#08130c",
  accentSoft: "#1d3a27",
  protein: "#6aa8ff",
  fat: "#f2c04c",
  carbs: "#ff8297",
  water: "#5cc3f2",
  warn: "#f0a050",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const radius = 18;
