import { FOODS } from "@ozginbol/core";
import Home from "../components/Home";

export default function Page() {
  return (
    <div className="wrap">
      <header className="top">
        <a className="logo" href="/">
          Ozgin<span>bol</span>
        </a>
        <nav className="links">
          <a href="#hisoblash">Hisoblash</a>
          <a href="#maqsad">Kunlik me'yor</a>
          <a href="#mening">Mening mahsulotlarim</a>
          <a href="#taomlar">Taomlar bazasi</a>
        </nav>
      </header>

      <Home />

      <footer>
        Bazada {FOODS.length} ta taom, mahsulot va masalliq. Qiymatlar 100 g uchun USDA FoodData Central, rus oziq-ovqat
        jadvallari va o'zbek oshxonasining ochiq retseptlari asosida hisoblangan (har bir taomning manbasini bosib ko'ring). Bu tibbiy maslahat emas: kasalligingiz
        bo'lsa, shifokor bilan maslahatlashing.
      </footer>
    </div>
  );
}
