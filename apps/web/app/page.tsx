import { FOODS } from "@ozginbol/core";
import Home from "../components/Home";
import { Footer, Header } from "../components/Chrome";
import { LangProvider } from "../components/i18n";

export default function Page() {
  return (
    <LangProvider>
      <Header />
      <Home foodCount={FOODS.length} />
      <Footer foodCount={FOODS.length} />
    </LangProvider>
  );
}
