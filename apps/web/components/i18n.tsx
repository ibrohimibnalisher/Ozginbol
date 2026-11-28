"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGS, isLang, translator, type Lang, type Tr } from "@ozginbol/core";

const KEY = "ozginbol.lang";
const Ctx = createContext<{ lang: Lang; tr: Tr; setLang: (l: Lang) => void }>({ lang: "uz", tr: translator("uz"), setLang: () => {} });

/** Saved choice, then ?lang=, then the browser language; Uzbek by default. */
function initialLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (isLang(q)) return q;
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage blocked */
  }
  const nav = (navigator.language || "").slice(0, 2);
  return nav === "ru" ? "ru" : nav === "en" ? "en" : "uz";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>("uz");
  useEffect(() => set(initialLang()), []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    set(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  };
  return <Ctx.Provider value={{ lang, tr: translator(lang), setLang }}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="lang-switch" role="group" aria-label="Til · Язык · Language">
      {LANGS.map((l) => (
        <button key={l.id} className={lang === l.id ? "on" : ""} onClick={() => setLang(l.id)} aria-pressed={lang === l.id} title={l.label}>
          {l.short}
        </button>
      ))}
    </div>
  );
}
