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
