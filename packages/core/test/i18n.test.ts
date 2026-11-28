import { describe, expect, it } from "vitest";
import { I18N_DICT, t } from "../src";

describe("i18n", () => {
  it("falls back to Uzbek and fills vars", () => {
    expect(t("ru", "Bu kalit yo'q {n}", { n: 3 })).toBe("Bu kalit yo'q 3");
    expect(t("uz", "{n} kun", { n: 2 })).toBe("2 kun");
  });
  it("translates templated core strings", () => {
    I18N_DICT.en["Sarf (TDEE): {0} × {1} (faollik) = {2} kkal"] = "Burn (TDEE): {0} × {1} (activity) = {2} kcal";
    expect(t("en", "Sarf (TDEE): 1650 × 1.375 (faollik) = 2269 kkal")).toBe("Burn (TDEE): 1650 × 1.375 (activity) = 2269 kcal");
  });
});

describe("dictionaries", () => {
  it("translate every collected UI string to Russian and English", async () => {
    const { readFileSync } = await import("node:fs");
    const keys: string[] = JSON.parse(readFileSync(new URL("../src/i18n/keys.json", import.meta.url), "utf8"));
    const { RU } = await import("../src/i18n/ru");
    const { EN } = await import("../src/i18n/en");
    expect(keys.filter((k) => !RU[k])).toEqual([]);
    expect(keys.filter((k) => !EN[k])).toEqual([]);
  });

  it("keeps placeholders in every translation", async () => {
    const { RU } = await import("../src/i18n/ru");
    const { EN } = await import("../src/i18n/en");
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const d of [RU, EN]) for (const [k, v] of Object.entries(d)) expect(ph(v), k).toBe(ph(k));
  });
});

describe("unit plurals", () => {
  it("declines Russian and pluralises English units", async () => {
    const { formatUnit } = await import("../src");
    expect(formatUnit("bolak", 2, "ru")).toBe("2 куска");
    expect(formatUnit("bolak", 5, "ru")).toBe("5 кусков");
    expect(formatUnit("bolak", 21, "ru")).toBe("21 кусок");
    expect(formatUnit("porsiya", 1.5, "ru")).toBe("1.5 порции");
    expect(formatUnit("bolak", 2, "en")).toBe("2 slices");
    expect(formatUnit("bolak", 1, "en")).toBe("1 slice");
    expect(formatUnit("bolak", 2, "uz")).toBe("2 bo'lak");
  });
});
