import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { radius, useTheme } from "../theme";

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.card, borderRadius: radius, borderColor: t.border, borderWidth: 1, padding: 16 }, style]}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  const t = useTheme();
  return <Text style={[{ color: t.muted, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>;
}

export function Button({ title, onPress, kind = "primary", disabled }: { title: string; onPress: () => void; kind?: "primary" | "ghost"; disabled?: boolean }) {
  const t = useTheme();
  const primary = kind === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: primary ? t.accent : t.card2,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: "center",
      })}
    >
      <Text style={{ color: primary ? t.accentInk : t.text, fontWeight: "700", fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: active ? t.accent : t.border,
        backgroundColor: active ? t.accentSoft : t.card,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: t.text, fontSize: 14, fontWeight: active ? "700" : "500" }}>{label}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[
        { backgroundColor: t.card2, color: t.text, borderRadius: 12, borderWidth: 1, borderColor: t.border, padding: 12, fontSize: 16 },
        props.style,
      ]}
    />
  );
}

/** Calorie ring: eaten vs budget, remaining in the middle. */
export function Ring({ value, max, size = 190, children }: { value: number; max: number; size?: number; children?: ReactNode }) {
  const t = useTheme();
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const over = value > max;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.card2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? t.warn : t.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - ratio)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const t = useTheme();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: t.text, fontWeight: "700", fontSize: 15, marginVertical: 4 }}>
        {Math.round(value)}
        <Text style={{ color: t.muted, fontWeight: "400" }}> / {max} g</Text>
      </Text>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: t.card2, overflow: "hidden" }}>
        <View style={{ width: `${pct}%`, height: 6, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>{children}</View>;
}
