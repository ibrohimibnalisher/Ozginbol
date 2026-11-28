"use client";

import { useEffect, useState } from "react";
import type { Food, Profile, Targets } from "@ozginbol/core";
import { computeTargets } from "@ozginbol/core";
import MealCalculator from "./MealCalculator";
import GoalCalculator from "./GoalCalculator";
import FoodTable from "./FoodTable";
import MyFoods from "./MyFoods";

const PROFILE_KEY = "ozginbol.profile.v1";
const FOODS_KEY = "ozginbol.myfoods.v1";

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

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myFoods, setMyFoods] = useState<Food[]>([]);

  useEffect(() => {
    setProfile(load<Profile>(PROFILE_KEY));
    setMyFoods(load<Food[]>(FOODS_KEY) ?? []);
  }, []);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    save(PROFILE_KEY, p);
  };
  const saveFoods = (list: Food[]) => {
    setMyFoods(list);
    save(FOODS_KEY, list);
  };

  const targets: Targets | null = profile ? computeTargets(profile) : null;

  return (
    <>
      <section className="hero" id="hisoblash">
        <h1>Nima yedingiz? Yozing, kaloriyasini darrov hisoblaymiz.</h1>
        <p>
          Osh, somsa, lag'mon va 140 dan ortiq taom va masalliq. Har bir raqamning manbasi ochiq. O'zbekcha, kirillcha yoki
          ruscha yozing: "2 ta katta somsa va 1 kosa lag'mon".
        </p>
        <MealCalculator targets={targets} weightKg={profile?.weightKg ?? 70} myFoods={myFoods} />
      </section>

      <section className="block" id="maqsad">
        <h2>Kunlik kaloriya me'yori</h2>
        <p className="sub">
          Sushka, ozish, vaznni saqlash yoki massa nabor: maqsadingizni tanlang, qancha kaloriya, oqsil, yog' va uglevod
          kerakligini bosqichma-bosqich hisoblab ko'rsatamiz.
        </p>
        <GoalCalculator initial={profile} targets={targets} onSave={saveProfile} />
      </section>

      <section className="block" id="mening">
        <h2>Mening mahsulotlarim</h2>
        <p className="sub">
          Bazada yo'q mahsulotni yorliqdagi qiymat bilan qo'shing yoki o'z retseptingizni masalliqlardan yig'ing. Keyin uni
          kalkulyatorga oddiy yozasiz.
        </p>
        <MyFoods foods={myFoods} onChange={saveFoods} />
      </section>

      <section className="block" id="taomlar">
        <h2>Taomlar bazasi</h2>
        <p className="sub">100 g dagi qiymatlar, odatiy porsiya va manba. Taomni bosing: retsepti va hisob-kitobi ochiladi.</p>
        <FoodTable myFoods={myFoods} />
      </section>
    </>
  );
}
