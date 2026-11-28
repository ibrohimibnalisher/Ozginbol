import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getFood } from "@ozginbol/core";
import { Store, shiftDay, tashkentDay } from "../src/db";
import { findFood, handleCallback, handleText, myFoods, newFood, newRecipe, plan, startOnboarding, today, undo, water, week, weight, workout } from "../src/logic";

let store: Store;
const ID = 42;
const user = () => store.getUser(ID)!;

function onboard() {
  store.ensureUser(ID, "Ali");
  startOnboarding(store, user());
  handleCallback(store, user(), "sex:male");
  handleText(store, user(), "30");
  handleText(store, user(), "178");
  handleText(store, user(), "85");
  handleCallback(store, user(), "act:light");
  handleCallback(store, user(), "goal:lose");
  handleCallback(store, user(), "rate:0.5");
  return handleText(store, user(), "78");
}

beforeEach(() => {
  store = new Store(":memory:");
});
afterEach(() => store.close());

describe("onboarding", () => {
  it("walks through the questions and shows targets", () => {
    const r = onboard();
    expect(r.text).toContain("1950 kkal");
    expect(r.text).toContain("Mifflin-St Jeor");
    expect(r.text).toContain("14 haftada"); // 7 kg at 0.5 kg/week
    expect(user()).toMatchObject({ step: "done", sex: "male", age: 30, heightCm: 178, weightKg: 85, goal: "lose", rateKgPerWeek: 0.5, targetWeightKg: 78 });
  });

  it("rejects silly numbers and accepts height in metres", () => {
    store.ensureUser(ID, "Ali");
    startOnboarding(store, user());
    handleCallback(store, user(), "sex:female");
    expect(handleText(store, user(), "5").text).toContain("10 dan 100");
    handleText(store, user(), "25");
    handleText(store, user(), "1.65");
    expect(user().heightCm).toBe(165);
  });
});

describe("food diary", () => {
  it("logs a meal and shows the remaining budget", () => {
    onboard();
    const r = handleText(store, user(), "2 ta somsa va 1 piyola choy");
    expect(r.text).toContain("Go'shtli somsa");
    const somsa = Math.round((getFood("somsa")!.per100.kcal * 260) / 100);
    expect(r.text).toContain(String(somsa));
    expect(r.text).toContain(`Yana <b>${1950 - somsa - 2}</b> kkal`);
    expect(store.day(ID).entries).toHaveLength(2);
  });

  it("undo removes the whole last meal", () => {
    onboard();
    handleText(store, user(), "1 kosa lag'mon");
    handleText(store, user(), "2 ta somsa va choy");
    expect(undo(store, user()).text).toMatch(/−\d+ kkal/);
    expect(store.day(ID).entries.map((e) => e.foodId)).toEqual(["lagmon"]);
  });

  it("logs nothing for unknown text and explains", () => {
    onboard();
    const r = handleText(store, user(), "qwertyzz");
    expect(r.text).toContain("topilmadi");
    expect(store.day(ID).entries).toHaveLength(0);
  });

  it("works before onboarding is finished", () => {
    store.ensureUser(ID, "Ali");
    const r = handleText(store, user(), "osh");
    expect(r.text).toContain("/maqsad");
  });

  it("recognises exercise written as plain text", () => {
    onboard();
    const r = handleText(store, user(), "30 daqiqa yugurdim");
    expect(r.text).toContain("Yugurish");
    expect(store.day(ID).burned).toBeGreaterThan(300);
  });
});

describe("reports and extras", () => {
  it("today shows macros and tips", () => {
    onboard();
    handleText(store, user(), "1 lagan osh, 3 ta somsa");
    const r = today(store, user());
    expect(r.text).toContain("Oqsil");
    expect(r.text).toContain("oshdi");
    expect(r.text).toContain("💡");
  });

  it("week report averages logged days", () => {
    onboard();
    const d = tashkentDay();
    store.addEntries(ID, [], d);
    handleText(store, user(), "1 porsiya osh");
    const r = week(store, user());
    expect(r.text).toContain(`O'rtacha: <b>${Math.round((getFood("osh")!.per100.kcal * 350) / 100)} kkal</b> (1 kun`);
  });

  it("water, weight and workouts", () => {
    onboard();
    water(store, user(), 500);
    expect(water(store, user(), 250).text).toContain("0.75 l");
    expect(weight(store, user(), "83.5").text).toContain("83.5 kg");
    expect(user().weightKg).toBe(83.5);
    expect(workout(store, user(), "zal 60").text).toContain("−418 kkal");
  });

  it("training plan follows the goal", () => {
    onboard();
    expect(plan(user()).text).toContain("Ozish");
  });

  it("shiftDay crosses months", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("goals, custom foods and sources", () => {
  it("sushka goal skips nothing and shows protein-heavy macros", () => {
    store.ensureUser(ID, "Ali");
    startOnboarding(store, user());
    handleCallback(store, user(), "sex:male");
    handleText(store, user(), "25");
    handleText(store, user(), "180");
    handleText(store, user(), "80");
    handleCallback(store, user(), "act:moderate");
    expect(handleCallback(store, user(), "goal:cut")!.buttons![0]!.map((b) => b.data)).toContain("rate:0.75");
    handleCallback(store, user(), "rate:0.5");
    const r = handleCallback(store, user(), "target:skip")!;
    expect(r.text).toContain("(sushka)");
    expect(r.text).toContain("Oqsil: 176 g");
  });

  it("maintain goes straight to targets", () => {
    store.ensureUser(ID, "Ali");
    startOnboarding(store, user());
    handleCallback(store, user(), "sex:female");
    handleText(store, user(), "30");
    handleText(store, user(), "165");
    handleText(store, user(), "60");
    handleCallback(store, user(), "act:light");
    expect(handleCallback(store, user(), "goal:maintain")!.text).toContain("vaznni saqlash");
  });

  it("adds a label product and logs it", () => {
    onboard();
    expect(newFood(store, user(), "Agusha tvorog, 159, 18, 9, 2, dona 100").text).toContain("qo'shildi");
    const r = handleText(store, user(), "2 ta agusha tvorog");
    expect(r.text).toContain("Agusha tvorog");
    expect(r.text).toContain("<b>318</b>");
    expect(myFoods(store, user()).buttons).toHaveLength(1);
    expect(handleCallback(store, user(), "del:0")!.text).toContain("o'chirildi");
    expect(store.customFoods(ID)).toHaveLength(0);
  });

  it("builds a recipe", () => {
    onboard();
    const r = newRecipe(store, user(), "Uy oshi: 1 kg guruch, 1 kg mol go'shti, 250 g yog', 1 kg sabzi | 4500 | 12");
    expect(r.text).toContain("Guruch (xom)");
    expect(r.text).toContain("1 porsiya (375 g)");
    expect(handleText(store, user(), "1 porsiya uy oshi").text).toContain("Uy oshi");
  });

  it("explains where somsa calories come from", () => {
    onboard();
    const r = findFood(store, user(), "somsa");
    expect(r.text).toContain("retsept");
    expect(r.text).toContain("Bug'doy uni");
    expect(r.text).toContain("kichik 90 g");
    handleText(store, user(), "1 katta somsa");
    expect(handleCallback(store, user(), "src")!.text).toContain("Dumba");
  });
});
