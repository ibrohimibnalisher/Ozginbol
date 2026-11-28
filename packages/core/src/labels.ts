import type { Lang, UnitKey } from "./types";

export const UNIT_LABELS: Record<UnitKey, Record<Lang, string>> = {
  g: { uz: "g", ru: "г", en: "g" },
  ml: { uz: "ml", ru: "мл", en: "ml" },
  dona: { uz: "dona", ru: "шт", en: "pcs" },
  porsiya: { uz: "porsiya", ru: "порция", en: "serving" },
  lagan: { uz: "lagan", ru: "ляган", en: "platter" },
  kosa: { uz: "kosa", ru: "коса", en: "bowl" },
  piyola: { uz: "piyola", ru: "пиала", en: "tea bowl" },
  stakan: { uz: "stakan", ru: "стакан", en: "glass" },
  bolak: { uz: "bo'lak", ru: "кусок", en: "slice" },
  osh_qoshiq: { uz: "osh qoshiq", ru: "ст. ложка", en: "tbsp" },
  choy_qoshiq: { uz: "choy qoshiq", ru: "ч. ложка", en: "tsp" },
  six: { uz: "six", ru: "шампур", en: "skewer" },
  banka: { uz: "banka", ru: "банка", en: "can" },
  shisha: { uz: "shisha", ru: "бутылка", en: "bottle" },
  hovuch: { uz: "hovuch", ru: "горсть", en: "handful" },
};

export function formatUnit(unit: UnitKey, quantity: number, lang: Lang = "uz"): string {
  const q = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1).replace(/\.0$/, "");
  const label = UNIT_LABELS[unit][lang];
  if (lang === "en" && quantity !== 1) return `${q} ${EN_PLURAL[unit] ?? label}`;
  const forms = lang === "ru" ? RU_PLURAL[unit] : undefined;
  if (forms && !Number.isInteger(quantity)) return `${q} ${forms[0]}`;
  if (forms) {
    const n = quantity % 100, d = quantity % 10;
    return `${q} ${n >= 11 && n <= 14 ? forms[1] : d === 1 ? label : d >= 2 && d <= 4 ? forms[0] : forms[1]}`;
  }
  return `${q} ${label}`;
}

const EN_PLURAL: Partial<Record<UnitKey, string>> = {
  porsiya: "servings", lagan: "platters", kosa: "bowls", piyola: "tea bowls", stakan: "glasses", bolak: "slices",
  six: "skewers", banka: "cans", shisha: "bottles", hovuch: "handfuls",
};

/** Russian forms for 2-4 and for 5+ (genitive singular / plural). */
const RU_PLURAL: Partial<Record<UnitKey, [string, string]>> = {
  porsiya: ["порции", "порций"], lagan: ["лягана", "ляганов"], kosa: ["косы", "кос"], piyola: ["пиалы", "пиал"],
  stakan: ["стакана", "стаканов"], bolak: ["куска", "кусков"], six: ["шампура", "шампуров"], banka: ["банки", "банок"],
  shisha: ["бутылки", "бутылок"], hovuch: ["горсти", "горстей"],
};
