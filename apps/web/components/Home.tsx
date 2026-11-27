"use client";

import { useEffect, useState } from "react";
import type { Profile, Targets } from "@ozginbol/core";
import { computeTargets } from "@ozginbol/core";
import MealCalculator from "./MealCalculator";
import GoalCalculator from "./GoalCalculator";
import FoodTable from "./FoodTable";

const PROFILE_KEY = "ozginbol.profile.v1";

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw) as Profile);
    } catch {
      /* storage unavailable: fine, the page works without it */
    }
  }, []);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  const targets: Targets | null = profile ? computeTargets(profile) : null;

  return (
    <>
      <section className="hero" id="hisoblash">
        <h1>Nima yedingiz? Yozing, kaloriyasini darrov hisoblaymiz.</h1>
        <p>
          Osh, somsa, lag'mon va yuzdan ortiq taom. O'zbekcha, kirillcha yoki ruscha yozsangiz ham tushunadi:
          "2 ta somsa va 1 kosa lag'mon".
        </p>
        <MealCalculator targets={targets} weightKg={profile?.weightKg ?? 70} />
      </section>

      <section className="block" id="maqsad">
        <h2>Kunlik me'yoringiz</h2>
        <p className="sub">
          Ma'lumotlaringizni kiriting: kuniga qancha kaloriya, oqsil, yog' va uglevod kerakligini hisoblaymiz.
        </p>
        <GoalCalculator initial={profile} targets={targets} onSave={saveProfile} />
      </section>

      <section className="block" id="taomlar">
        <h2>Taomlar bazasi</h2>
        <p className="sub">100 g dagi qiymatlar va odatiy porsiya.</p>
        <FoodTable />
      </section>
    </>
  );
}
