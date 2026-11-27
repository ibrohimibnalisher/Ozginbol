import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Store, shiftDay, tashkentDay } from "../src/db";
import { handleCallback, handleText, plan, startOnboarding, today, undo, water, week, weight, workout } from "../src/logic";

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
  return handleCallback(store, user(), "goal:lose")!;
}

beforeEach(() => {
  store = new Store(":memory:");
});
afterEach(() => store.close());

describe("onboarding", () => {
  it("walks through the questions and shows targets", () => {
    const r = onboard();
    expect(r.text).toContain("2000 kkal");
    expect(user()).toMatchObject({ step: "done", sex: "male", age: 30, heightCm: 178, weightKg: 85, goal: "lose" });
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
    expect(r.text).toContain("754");
    expect(r.text).toContain("Yana <b>1244</b> kkal");
    expect(store.day(ID).entries).toHaveLength(2);
  });

  it("undo removes the whole last meal", () => {
    onboard();
    handleText(store, user(), "1 kosa lag'mon");
    handleText(store, user(), "2 ta somsa va choy");
    expect(undo(store, user()).text).toContain("−756 kkal");
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
    expect(r.text).toContain("O'rtacha: <b>683 kkal</b> (1 kun");
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
