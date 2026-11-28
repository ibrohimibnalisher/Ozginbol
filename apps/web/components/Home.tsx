"use client";

import { useEffect, useState } from "react";
import type { Food, Profile, Targets } from "@ozginbol/core";
import { computeTargets } from "@ozginbol/core";
import MealCalculator from "./MealCalculator";
import GoalCalculator from "./GoalCalculator";
import BodyCalculator, { type BodyEntry } from "./BodyCalculator";
import FoodTable from "./FoodTable";
import MyFoods from "./MyFoods";
import MenuPlanner from "./MenuPlanner";
import { Send } from "./Icons";
import { useT } from "./i18n";

const PROFILE_KEY = "ozginbol.profile.v1";
const FOODS_KEY = "ozginbol.myfoods.v1";
const BODY_KEY = "ozginbol.body.v1";
const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL;

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable: the page still works for this visit */
  }
}

function Head({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  const { tr } = useT();
  return (
    <div className="sec-head">
      <div>
        <div className="tag">{tr(tag)}</div>
        <h2>{tr(title)}</h2>
        <p>{tr(sub)}</p>
      </div>
    </div>
  );
}

export default function Home({ foodCount }: { foodCount: number }) {
  const { tr } = useT();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myFoods, setMyFoods] = useState<Food[]>([]);
  const [body, setBody] = useState<BodyEntry[]>([]);

  useEffect(() => {
    setProfile(load<Profile>(PROFILE_KEY));
    setMyFoods(load<Food[]>(FOODS_KEY) ?? []);
    setBody(load<BodyEntry[]>(BODY_KEY) ?? []);
  }, []);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    save(PROFILE_KEY, p);
  };
  const saveFoods = (list: Food[]) => {
    setMyFoods(list);
    save(FOODS_KEY, list);
  };
  const saveBody = (list: BodyEntry[]) => {
    setBody(list);
    save(BODY_KEY, list);
  };

  const targets: Targets | null = profile ? computeTargets(profile) : null;

  return (
    <>
      <section className="hero" id="hisoblash">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">{tr("O'zbek taomlarini biladigan kaloriya kalkulyatori")}</span>
            <h1>
              {tr("Nima yedingiz?")} <em>{tr("Yozing")}</em>
              {tr(", kaloriyasini darrov hisoblaymiz.")}
            </h1>
            <p className="lead">
              {tr("Osh, somsa, lag'mon va {n} dan ortiq taom. O'zbekcha, kirillcha yoki ruscha yozing. Har bir raqamning qayerdan olingani ochiq.", { n: foodCount })}
            </p>
            <ul className="trust">
              <li>{tr("Ro'yxatdan o'tmasdan")}</li>
              <li>{tr("Manbasi ochiq raqamlar")}</li>
              <li>{tr("Sushka va massa rejimlari")}</li>
            </ul>
            <div className="hero-stats">
              <div>
                <b>{foodCount}+</b>
                <span>{tr("taom va masalliq")}</span>
              </div>
              <div>
                <b>19</b>
                <span>{tr("milliy retsept hisobi")}</span>
              </div>
              <div>
                <b>12</b>
                <span>{tr("vitamin va mineral")}</span>
              </div>
            </div>
          </div>
          <MealCalculator targets={targets} profile={profile} myFoods={myFoods} />
        </div>
      </section>

      <main className="wrap sections">
        <div className="spacer" />
        <section className="block" id="maqsad">
          <Head
            tag="Kunlik me'yor"
            title="Qancha yeyish kerak?"
            sub="Sushka, ozish, vaznni saqlash yoki massa nabor. Maqsadingizni tanlang: kaloriya, oqsil, yog' va uglevodni bosqichma-bosqich hisoblab ko'rsatamiz."
          />
          <GoalCalculator initial={profile} targets={targets} onSave={saveProfile} />
        </section>

        <section className="block" id="menyu">
          <Head
            tag="Ovqatlanish rejasi"
            title="Bugungi menyu"
            sub="Me'yoringizga mos, o'zbek taomlaridan iborat kunlik menyu. Yoqmasa, boshqa variantini oling."
          />
          <MenuPlanner targets={targets} profile={profile} />
        </section>

        <section className="block" id="tana">
          <Head
            tag="Tana tarkibi"
            title="Yog' foizi va o'lchamlar"
            sub="Santimetr lenta bilan bo'yin, bel (ayollarda son) aylanasini o'lchang. Yog' foizi, yog' va mushak massasi, bel xavfi chiqadi. Har o'lchovni saqlab, o'zgarishni kuzating."
          />
          <BodyCalculator profile={profile} history={body} onHistory={saveBody} onUseFat={(pct) => profile && saveProfile({ ...profile, bodyFatPct: pct })} />
        </section>

        <section className="block" id="mening">
          <Head
            tag="O'z mahsulotlaringiz"
            title="Mening mahsulotlarim"
            sub="Bazada yo'q mahsulotni yorliqdagi qiymat bilan qo'shing yoki o'z retseptingizni masalliqlardan yig'ing. Keyin uni kalkulyatorga oddiy yozasiz."
          />
          <MyFoods foods={myFoods} onChange={saveFoods} />
        </section>

        <section className="block" id="taomlar">
          <Head tag="Ochiq baza" title="Taomlar bazasi" sub="100 g dagi qiymatlar, odatiy porsiya va manba. Taomni bosing: retsepti va hisob-kitobi ochiladi." />
          <FoodTable myFoods={myFoods} />
        </section>

        <section className="block" id="bot">
          <div className="cta-band">
            <div>
              <h3>{tr("Telegram botda ham xuddi shunday")}</h3>
              <p>
                {tr('Botga "2 ta somsa va choy" deb yozing: kundalikka qo\'shadi, kun oxirida hisobot beradi, suv va vaznni eslatadi. O\'lchamlarni ham yozasiz: "/olcham bo\'yin 38 bel 85". Til: /til.')}
              </p>
            </div>
            {BOT_URL && (
              <a className="pill-link" href={BOT_URL} rel="noopener">
                <Send />
                {tr("Botni ochish")}
              </a>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
