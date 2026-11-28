import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle, type ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { radius, useTheme } from "../theme";

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: radius,
          padding: 18,
          borderWidth: t.dark ? 1 : 0,
          borderColor: t.border,
          shadowColor: "#0b1a12",
          shadowOpacity: t.dark ? 0 : 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: t.dark ? 0 : 2,
        },
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 }}>{children}</Text>;
}

export function H2({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[{ color: t.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.3, marginBottom: 10 }, style]}>{children}</Text>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[{ color: t.muted, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  kind = "primary",
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const t = useTheme();
  const bg = kind === "primary" ? t.accent : kind === "danger" ? t.warnSoft : t.card2;
  const fg = kind === "primary" ? t.accentInk : kind === "danger" ? t.warn : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: bg,
        opacity: disabled ? 0.45 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        borderRadius: 14,
        minHeight: 52,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
      })}
    >
      {icon}
      <Text style={{ color: fg, fontWeight: "800", fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        borderRadius: 999,
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderWidth: 1.5,
        borderColor: active ? t.accent : t.border,
        backgroundColor: active ? t.accentSoft : t.card,
        marginRight: 8,
        marginBottom: 8,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: active ? t.accentStrong : t.text, fontSize: 14, fontWeight: active ? "800" : "600" }}>{label}</Text>
    </Pressable>
  );
}

/** Segmented control, e.g. Erkak / Ayol. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: t.card2, borderRadius: 14, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? t.card : "transparent",
              shadowColor: "#000",
              shadowOpacity: on && !t.dark ? 0.08 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            <Text style={{ color: on ? t.text : t.muted, fontWeight: "800", fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={t.faint}
      {...props}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={[
        {
          backgroundColor: focus ? t.card : t.card2,
          color: t.text,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: focus ? t.accent : "transparent",
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: 50,
          fontSize: 16,
          fontWeight: "600",
        },
        props.style,
      ]}
    />
  );
}

export function Field({ label, children, style }: { label: string; children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ flex: 1, minWidth: 90 }, style]}>
      <Text style={{ color: t.muted, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

/** Progress ring with content in the middle. */
export function Ring({
  value,
  max,
  size = 190,
  stroke = 16,
  color,
  track,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const over = value > max;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? t.card2} strokeWidth={stroke} fill="none" />
        {ratio > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={over ? t.warn : (color ?? t.accent)}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - ratio)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
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
      <Row style={{ gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ color: t.muted, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      </Row>
      <Text style={{ color: t.text, fontWeight: "800", fontSize: 17, marginVertical: 6, letterSpacing: -0.3 }}>
        {Math.round(value)}
        <Text style={{ color: t.faint, fontWeight: "600", fontSize: 13 }}> / {max} g</Text>
      </Text>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: t.card2, overflow: "hidden" }}>
        <View style={{ width: `${pct}%`, height: 6, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

export function Stat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.card2, borderRadius: 16, padding: 12 }}>
      <Text style={{ color: tone ?? t.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}>{value}</Text>
      <Text style={{ color: t.muted, fontSize: 12, fontWeight: "600", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>{children}</View>;
}

/** Rounded tile holding an icon, used for list rows and meal headers. */
export function IconTile({ children, bg, size = 40 }: { children: ReactNode; bg?: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg ?? t.accentSoft, alignItems: "center", justifyContent: "center" }}>
      {children}
    </View>
  );
}

const ICONS = {
  home: "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  run: "M13 4a2 2 0 1 0 0-.01M7 21l3-6 3 2 2 4M10 15l1-5 4 2 3-1M8 9l3-1",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  bowl: "M3 11h18a9 9 0 0 1-18 0zM8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  apple: "M12 7c-2-2-7-1.5-7 4 0 4 3 9 5 9 1 0 1.3-.5 2-.5s1 .5 2 .5c2 0 5-5 5-9 0-5.5-5-6-7-4zM12 7c0-2 1-4 3-4",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  flame: "M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-6.5 1-8.5z",
  ruler: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  scale: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 10a4 4 0 0 1 8 0M12 10l1.5-2",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  chevronL: "M15 18l-6-6 6-6",
  chevronR: "M9 18l6-6-6-6",
  close: "M18 6L6 18M6 6l12 12",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  steps: "M8 3c1.7 0 3 1.8 3 4.5S9.9 12 8.5 12 6 10.5 6 8s.3-5 2-5zM6.5 14h4l-.5 3a2 2 0 0 1-4 0zM16 7c1.7 0 2 2.5 2 5s-1 4.5-2.5 4.5S13 14.2 13 11.5 14.3 7 16 7zM13.5 18h4l-.5 1.5a2 2 0 0 1-3.5 0z",
  menu: "M4 6h16M4 12h10M4 18h7M17 15l2 2 3-4",
  trophy: "M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0",
  share: "M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color, stroke = 2 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={ICONS[name]} stroke={color ?? t.text} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
