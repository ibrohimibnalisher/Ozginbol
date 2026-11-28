"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "./Icons";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setDark(set ? set === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("ozginbol.theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };
  return (
    <button className="icon-btn" onClick={toggle} aria-label={dark ? "Kunduzgi rejim" : "Tungi rejim"} title={dark ? "Kunduzgi rejim" : "Tungi rejim"}>
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
