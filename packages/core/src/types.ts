export type Lang = "uz" | "ru" | "en";

/** Portion units people actually use when they talk about food. */
export type UnitKey =
  | "g"
  | "ml"
  | "dona" // one piece: 1 ta somsa, 1 dona olma
  | "porsiya" // a normal restaurant / home serving (tarelka)
  | "lagan" // a big shared plate (mainly for osh)
  | "kosa" // soup bowl
  | "piyola" // tea bowl, ~150 ml
  | "stakan" // glass, ~250 ml
  | "bolak" // slice / piece cut from something bigger
  | "osh_qoshiq" // tablespoon
  | "choy_qoshiq" // teaspoon
  | "six" // skewer (shashlik)
  | "banka" // can, 330 ml
  | "shisha" // bottle, 500 ml
  | "hovuch"; // handful

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
}

export type FoodCategory =
  | "milliy" // Uzbek / Central Asian dishes
  | "non" // bread & bakery
  | "gosht" // meat, fish, eggs
  | "sut" // dairy
  | "don" // grains, pasta, potatoes
  | "sabzavot"
  | "meva"
  | "yongoq"
  | "ichimlik"
  | "shirinlik"
  | "fastfud"
  | "yog"
  | "boshqa";

export interface Food {
  id: string;
  name: Record<Lang, string>;
  /** Extra spellings people type, in any language/script. Lowercase. */
  aliases: string[];
  category: FoodCategory;
  /** Nutrition per 100 g (or 100 ml for drinks). */
  per100: Macros;
  /** Grams (or ml) in one of each unit. */
  portions: Partial<Record<UnitKey, number>>;
  /** Unit used when the user gives only a number ("2 somsa") or nothing ("osh"). */
  defaultUnit: UnitKey;
  liquid?: boolean;
  /**
   * Where the numbers come from. "usda": USDA FoodData Central;
   * "ru-table": Russian standard composition tables (Skurikhin);
   * "recipe": computed from a typical Uzbek home/restaurant recipe.
   */
  source: "usda" | "ru-table" | "recipe" | "label";
}

export interface ParsedItem {
  /** Text fragment this item came from. */
  input: string;
  food: Food;
  quantity: number;
  unit: UnitKey;
  grams: number;
  nutrition: Macros;
  /** 0..1, how sure the matcher is about the food. */
  confidence: number;
}

export interface ParseResult {
  items: ParsedItem[];
  /** Fragments we could not match to any food. */
  unknown: string[];
  total: Macros;
}
