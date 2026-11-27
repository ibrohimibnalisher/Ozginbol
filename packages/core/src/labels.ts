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
  return `${q} ${UNIT_LABELS[unit][lang]}`;
}
