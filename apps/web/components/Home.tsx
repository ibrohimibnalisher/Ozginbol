"use client";

import { useEffect, useState } from "react";
import type { Food, Profile, Targets } from "@ozginbol/core";
import { computeTargets } from "@ozginbol/core";
import MealCalculator from "./MealCalculator";
import GoalCalculator from "./GoalCalculator";
import BodyCalculator, { type BodyEntry } from "./BodyCalculator";
import FoodTable from "./FoodTable";
import MyFoods from "./MyFoods";
import { Send } from "./Icons";

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
  return (
    <div className="sec-head">
      <div>
        <div className="tag">{tag}</div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
    </div>
  );
}

export default function Home({ foodCount }: { foodCount: number }) {
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
            <span className="eyebrow">O'zbek taomlarini biladigan kaloriya kalkulyatori</span>
            <h1>
              Nima yedingiz? <em>Yozing</em>, kaloriyasini darrov hisoblaymiz.
            </h1>
            <p className="lead">
              Osh, somsa, lag'mon va {foodCount} dan ortiq taom. O'zbekcha, kirillcha yoki ruscha yozing. Har bir raqamning qayerdan olingani ochiq.
            </p>
            <ul className="trust">
              <li>Ro'yxatdan o'tmasdan</li>
              <li>Manbasi ochiq raqamlar</li>
              <li>Sushka va massa rejimlari</li>
            </ul>
            <div className="hero-stats">
              <div>
                <b>{foodCount}+</b>
                <span>taom va masalliq</span>
              </div>
              <div>
                <b>19</b>
                <span>milliy retsept hisobi</span>
              </div>
              <div>
                <b>3</b>
                <span>til: uz, ўз, ru</span>
              </div>
            </div>
          </div>
          <MealCalculator targets={targets} weightKg={profile?.weightKg ?? 70} myFoods={myFoods} />
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
              <h3>Telegram botda ham xuddi shunday</h3>
              <p>
                Botga "2 ta somsa va choy" deb yozing: kundalikka qo'shadi, kun oxirida hisobot beradi, suv va vaznni eslatadi. O'lchamlarni ham
                yozasiz: "/olcham bo'yin 38 bel 85".
              </p>
            </div>
            {BOT_URL && (
              <a className="pill-link" href={BOT_URL} rel="noopener">
                <Send />
                Botni ochish
              </a>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
