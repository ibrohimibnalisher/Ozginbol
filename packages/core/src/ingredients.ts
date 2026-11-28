import type { Food } from "./types";

type M = [kcal: number, protein: number, fat: number, carbs: number, fiber?: number];

/**
 * Raw ingredients. They are the building blocks of every national-dish recipe
 * (see recipes.ts) and of the user's own recipes, and can be logged directly
 * ("100 g un"). Values per 100 g of the raw product.
 */
function ing(id: string, names: [string, string, string], aliases: string[], m: M, ref: string, portions: Food["portions"] = {}, source: Food["source"] = "usda"): Food {
  const [kcal, protein, fat, carbs, fiber] = m;
  return {
    id,
    name: { uz: names[0], ru: names[1], en: names[2] },
    aliases,
    category: "xomashyo",
    per100: { kcal, protein, fat, carbs, ...(fiber !== undefined ? { fiber } : {}) },
    portions: { g: 1, ...portions },
    defaultUnit: "g",
    source,
    ref,
  };
}

export const INGREDIENTS: Food[] = [
  ing("x_un", ["Bug'doy uni", "Мука пшеничная", "Wheat flour"], ["un", "bug'doy uni", "oq un", "мука", "flour"],
    [364, 10.3, 1, 76.3, 2.7], "USDA SR Legacy 20081: Wheat flour, white, all-purpose, enriched", { stakan: 130, osh_qoshiq: 10 }),
  ing("x_guruch", ["Guruch (xom)", "Рис сырой", "Rice, raw"], ["xom guruch", "guruch xom", "devzira", "лазер", "рис сырой", "raw rice", "guruch"],
    [360, 6.6, 0.6, 79.3, 1.3], "USDA SR Legacy 20052: Rice, white, medium-grain, raw", { stakan: 200 }),
  ing("x_mol", ["Mol go'shti (xom)", "Говядина сырая", "Beef, raw"], ["xom mol go'shti", "mol go'shti xom", "mol go'shti", "go'sht", "говядина", "beef"],
    [215, 18.6, 15, 0], "USDA SR Legacy 23572: Beef, ground, 85% lean / 15% fat, raw"),
  ing("x_qoy", ["Qo'y go'shti (xom)", "Баранина сырая", "Lamb, raw"], ["xom qo'y go'shti", "qo'y go'shti xom", "qo'y go'shti", "баранина", "lamb"],
    [282, 16.6, 23.4, 0], "USDA SR Legacy 17001: Lamb, domestic, composite of trimmed retail cuts, raw"),
  ing("x_dumba", ["Dumba yog'i", "Курдючный жир", "Lamb tail fat"], ["dumba", "dumba yog'i", "курдюк", "курдючный жир"],
    [750, 2.5, 82, 0], "Rus oziq-ovqat tarkibi jadvali (Skurikhin): qo'y yog'i, xom (taxminiy)", {}, "ru-table"),
  ing("x_tovuq", ["Tovuq go'shti (xom)", "Курица сырая", "Chicken, raw"], ["xom tovuq", "tovuq xom", "tovuq go'shti", "курица сырая"],
    [215, 18.6, 15.1, 0], "USDA SR Legacy 05006: Chicken, broilers, meat and skin, raw"),
  ing("x_yog", ["O'simlik yog'i", "Масло растительное", "Vegetable oil"], ["yog'", "paxta yog'i", "kungaboqar yog'i", "o'simlik yog'i", "масло", "oil"],
    [884, 0, 100, 0], "USDA SR Legacy 04044: Oil, soybean / cottonseed, salad or cooking", { osh_qoshiq: 14, choy_qoshiq: 5 }),
  ing("x_sabzi", ["Sabzi (xom)", "Морковь", "Carrot, raw"], ["sabzi", "sariq sabzi", "морковь", "carrot"],
    [41, 0.9, 0.2, 9.6, 2.8], "USDA SR Legacy 11124: Carrots, raw", { dona: 80 }),
  ing("x_piyoz", ["Piyoz", "Лук репчатый", "Onion"], ["piyoz", "лук", "onion"],
    [40, 1.1, 0.1, 9.3, 1.7], "USDA SR Legacy 11282: Onions, raw", { dona: 110 }),
  ing("x_kartoshka", ["Kartoshka (xom)", "Картофель сырой", "Potato, raw"], ["xom kartoshka", "kartoshka xom", "картофель сырой", "raw potato", "kartoshka"],
    [77, 2, 0.1, 17.5, 2.2], "USDA SR Legacy 11352: Potatoes, flesh and skin, raw", { dona: 150 }),
  ing("x_pomidor", ["Pomidor", "Помидор", "Tomato"], ["pomidor", "помидор", "tomato"],
    [18, 0.9, 0.2, 3.9, 1.2], "USDA SR Legacy 11529: Tomatoes, red, ripe, raw", { dona: 120 }),
  ing("x_qalampir", ["Bulg'or qalampiri", "Перец болгарский", "Bell pepper"], ["bulg'or qalampir", "qalampir", "болгарский перец", "bell pepper"],
    [26, 1, 0.3, 6, 2.1], "USDA SR Legacy 11821: Peppers, sweet, red, raw", { dona: 150 }),
  ing("x_sarimsoq", ["Sarimsoq", "Чеснок", "Garlic"], ["sarimsoq", "чеснок", "garlic"],
    [149, 6.4, 0.5, 33.1, 2.1], "USDA SR Legacy 11215: Garlic, raw", { dona: 40 }),
  ing("x_noxat", ["No'xat (quruq)", "Нут", "Chickpeas, dry"], ["no'xat", "noxat", "нут", "chickpeas"],
    [378, 20.5, 6, 63, 12.2], "USDA SR Legacy 16056: Chickpeas, mature seeds, raw", { stakan: 200 }),
  ing("x_mosh", ["Mosh (quruq)", "Маш", "Mung beans, dry"], ["mosh", "маш", "mung"],
    [347, 23.9, 1.2, 62.6, 16.3], "USDA SR Legacy 16080: Mung beans, mature seeds, raw", { stakan: 200 }),
  ing("x_tuxum", ["Tuxum (xom)", "Яйцо сырое", "Egg, raw"], ["xom tuxum", "tuxum", "яйцо", "egg"],
    [143, 12.6, 9.5, 0.7], "USDA SR Legacy 01123: Egg, whole, raw, fresh", { dona: 55 }),
  ing("x_qovoq", ["Qovoq", "Тыква", "Pumpkin"], ["qovoq", "тыква", "pumpkin"],
    [26, 1, 0.1, 6.5, 0.5], "USDA SR Legacy 11422: Pumpkin, raw"),
  ing("x_karam", ["Karam", "Капуста", "Cabbage"], ["karam", "капуста", "cabbage"],
    [25, 1.3, 0.1, 5.8, 2.5], "USDA SR Legacy 11109: Cabbage, raw"),
  ing("x_kokat", ["Ko'kat (ismaloq, shivit, kashnich)", "Зелень", "Fresh greens"], ["ko'kat", "ismaloq", "shivit", "kashnich", "зелень", "шпинат", "greens", "spinach"],
    [23, 2.9, 0.4, 3.6, 2.2], "USDA SR Legacy 11457: Spinach, raw", { hovuch: 30 }),
  ing("x_bodring", ["Bodring", "Огурец", "Cucumber"], ["bodring", "огурец", "cucumber"],
    [15, 0.7, 0.1, 3.6, 0.5], "USDA SR Legacy 11205: Cucumber, with peel, raw", { dona: 100 }),
  ing("x_qatiq", ["Qatiq", "Катык", "Katyk"], ["qatiq", "катык"],
    [60, 3, 3.2, 4.1], "Rus oziq-ovqat tarkibi jadvali (Skurikhin): katyk 3.2%", { stakan: 250 }, "ru-table"),
  ing("x_tuz", ["Tuz", "Соль", "Salt"], ["tuz", "osh tuzi", "соль", "salt"],
    [0, 0, 0, 0], "USDA SR Legacy 02047: Salt, table", { choy_qoshiq: 6, osh_qoshiq: 18 }),
  ing("x_suv", ["Suv", "Вода", "Water"], ["suv", "вода", "water"],
    [0, 0, 0, 0], "Suv kaloriyasiz", { stakan: 250 }),
];
