"use client";

import { useT, LangSwitch } from "./i18n";
import ThemeToggle from "./ThemeToggle";
import { Logo, Send } from "./Icons";

export function Header() {
  const { tr } = useT();
  return (
    <header className="top">
      <div className="wrap">
        <a className="logo" href="/">
          <Logo />
          Ozginbol
        </a>
        <nav className="links">
          <a href="#hisoblash">{tr("Kaloriya")}</a>
          <a href="#maqsad">{tr("Kunlik me'yor")}</a>
          <a href="#menyu">{tr("Menyu")}</a>
          <a href="#tana">{tr("Yog' foizi")}</a>
          <a href="#mening">{tr("Mahsulotlarim")}</a>
          <a href="#taomlar">{tr("Taomlar")}</a>
        </nav>
        <div className="head-actions">
          <LangSwitch />
          <ThemeToggle />
          <a className="pill-link" href="#bot">
            <Send />
            <span>{tr("Telegram bot")}</span>
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer({ foodCount }: { foodCount: number }) {
  const { tr } = useT();
  return (
    <div className="wrap">
      <footer>
        <div className="logo">
          <Logo size={24} />
          Ozginbol
        </div>
        {tr(
          "Bazada {n} ta taom, mahsulot va masalliq. Qiymatlar 100 g uchun USDA FoodData Central, rus oziq-ovqat jadvallari va o'zbek oshxonasining ochiq retseptlari asosida hisoblangan (har bir taomning manbasini bosib ko'ring). Vitamin va minerallar USDA bazasidan, kunlik me'yorlar AQSh Milliy akademiyalari (NIH) jadvallaridan. Yog' foizi AQSh harbiy-dengiz flotining (US Navy) lenta usulida hisoblanadi. Bu tibbiy maslahat emas: kasalligingiz bo'lsa, shifokor bilan maslahatlashing.",
          { n: foodCount },
        )}
      </footer>
    </div>
  );
}
