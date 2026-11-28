import { FOODS } from "@ozginbol/core";
import Home from "../components/Home";
import ThemeToggle from "../components/ThemeToggle";
import { Logo, Send } from "../components/Icons";

export default function Page() {
  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="logo" href="/">
            <Logo />
            Ozginbol
          </a>
          <nav className="links">
            <a href="#hisoblash">Kaloriya</a>
            <a href="#maqsad">Kunlik me'yor</a>
            <a href="#menyu">Menyu</a>
            <a href="#tana">Yog' foizi</a>
            <a href="#mening">Mahsulotlarim</a>
            <a href="#taomlar">Taomlar</a>
          </nav>
          <div className="head-actions">
            <ThemeToggle />
            <a className="pill-link" href="#bot">
              <Send />
              <span>Telegram bot</span>
            </a>
          </div>
        </div>
      </header>

      <Home foodCount={FOODS.length} />

      <div className="wrap">
        <footer>
          <div className="logo">
            <Logo size={24} />
            Ozginbol
          </div>
          Bazada {FOODS.length} ta taom, mahsulot va masalliq. Qiymatlar 100 g uchun USDA FoodData Central, rus oziq-ovqat jadvallari va o'zbek
          oshxonasining ochiq retseptlari asosida hisoblangan (har bir taomning manbasini bosib ko'ring). Yog' foizi AQSh harbiy-dengiz flotining
          (US Navy) lenta usulida hisoblanadi. Bu tibbiy maslahat emas: kasalligingiz bo'lsa, shifokor bilan maslahatlashing.
        </footer>
      </div>
    </>
  );
}
