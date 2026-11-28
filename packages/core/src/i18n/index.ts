import type { Lang } from "../types";
import { EN } from "./en";
import { RU } from "./ru";

/**
 * UI strings are written in Uzbek in the code and the Uzbek text is the key:
 * t("ru", "Bugun") → "Сегодня". A missing translation falls back to Uzbek, so
 * the app never shows an empty label. `{name}` placeholders are filled from vars.
 */
const DICT: Record<Exclude<Lang, "uz">, Record<string, string>> = { ru: RU, en: EN };

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "uz", label: "O'zbekcha", short: "UZ" },
  { id: "ru", label: "Русский", short: "RU" },
  { id: "en", label: "English", short: "EN" },
];

/**
 * Keys with positional slots ("Sarf (TDEE): {0} × {1} = {2} kkal") also
 * translate text that core built with numbers inside, such as calculation steps.
 */
type Tpl = { re: RegExp; out: string };
const TPL: Record<string, Tpl[]> = {};
function templates(lang: Exclude<Lang, "uz">): Tpl[] {
  if (!TPL[lang]) {
    TPL[lang] = Object.entries(DICT[lang])
      .filter(([k]) => /\{\d\}/.test(k))
      .sort(([a], [b]) => b.length - a.length)
      .map(([k, out]) => ({ re: new RegExp(`^${k.split(/\{\d\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(.+?)")}$`), out, k }))
      .map(({ re, out, k }) => {
        const order = [...k.matchAll(/\{(\d)\}/g)].map((m) => Number(m[1]));
        return { re, out: out.replace(/\{(\d)\}/g, (_, d: string) => `\u0000${order.indexOf(Number(d))}\u0000`) };
      });
  }
  return TPL[lang]!;
}

function lookup(lang: Exclude<Lang, "uz">, uz: string): string {
  const hit = DICT[lang][uz];
  if (hit !== undefined) return hit;
  for (const tp of templates(lang)) {
    const m = tp.re.exec(uz);
    if (m) return tp.out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => lookupPart(lang, m[Number(i) + 1] ?? ""));
  }
  return uz;
}
/** A slot may itself be a translatable word ("(yuqori)"), numbers pass through. */
function lookupPart(lang: Exclude<Lang, "uz">, s: string): string {
  return DICT[lang][s] ?? s;
}

export function t(lang: Lang, uz: string, vars?: Record<string, string | number>): string {
  const s = lang === "uz" ? uz : lookup(lang, uz);
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Bind a language once: const tr = translator("ru"); tr("Bugun"). */
export function translator(lang: Lang) {
  return (uz: string, vars?: Record<string, string | number>) => t(lang, uz, vars);
}
export type Tr = ReturnType<typeof translator>;

export function isLang(x: unknown): x is Lang {
  return x === "uz" || x === "ru" || x === "en";
}

/** Dictionaries, for tests that check every used key is translated. */
export const I18N_DICT = DICT;

const MONTHS: Record<Lang, string[]> = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** "5-mart", "5 марта", "Mar 5". */
export function monthDay(d: number, m: number, lang: Lang): string {
  const name = MONTHS[lang][m - 1] ?? "";
  return lang === "uz" ? `${d}-${name}` : lang === "ru" ? `${d} ${name}` : `${name} ${d}`;
}
