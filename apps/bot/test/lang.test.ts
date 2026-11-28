import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Store } from "../src/db";
import { withLang } from "../src/lang";
import { handleCallback, handleText, today, vitamins } from "../src/logic";

let store: Store;
const ID = 7;
const user = () => store.getUser(ID)!;
beforeEach(() => {
  store = new Store(":memory:");
  store.ensureUser(ID, "Ann");
});
afterEach(() => store.close());

describe("languages", () => {
  it("switches language and answers in it", () => {
    const r = handleCallback(store, user(), "lang:ru")!;
    expect(user().lang).toBe("ru");
    expect(r.text).toContain("Язык: Русский");
  });

  it("logs Russian and English meals and reports vitamins in that language", () => {
    store.updateUser(ID, { lang: "en" });
    const meal = withLang("en", () => handleText(store, user(), "2 eggs and 1 banana"));
    expect(meal.text).toMatch(/kcal/);
    const v = withLang("en", () => vitamins(store, user()));
    expect(v.text).toContain("Vitamins and minerals");
    expect(withLang("en", () => today(store, user())).text).toContain("Today");
  });
});
