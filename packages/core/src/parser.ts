import { FOODS } from "./foods";
import { editDistance, key, normalize, stem } from "./normalize";
import type { Food, Macros, ParseResult, ParsedItem, UnitKey } from "./types";

// ───────────────────────── units ─────────────────────────

type UnitSpec = { unit: UnitKey; factor?: number };

/** Unit words in normalised (Latin) form. Multi-word units are joined first. */
const UNIT_WORDS: Record<string, UnitSpec> = {
  g: { unit: "g" }, gr: { unit: "g" }, gramm: { unit: "g" }, gram: { unit: "g" }, grams: { unit: "g" }, grm: { unit: "g" },
  kg: { unit: "g", factor: 1000 }, kilo: { unit: "g", factor: 1000 }, kilogramm: { unit: "g", factor: 1000 },
  ml: { unit: "ml" }, l: { unit: "ml", factor: 1000 }, litr: { unit: "ml", factor: 1000 }, liter: { unit: "ml", factor: 1000 },
  ta: { unit: "dona" }, dona: { unit: "dona" }, sht: { unit: "dona" }, shtuk: { unit: "dona" }, shtuki: { unit: "dona" },
  shtuka: { unit: "dona" }, pcs: { unit: "dona" }, piece: { unit: "dona" }, pieces: { unit: "dona" }, x: { unit: "dona" },
  porsiya: { unit: "porsiya" }, portsiya: { unit: "porsiya" }, portsii: { unit: "porsiya" }, portsiy: { unit: "porsiya" },
  tarelka: { unit: "porsiya" }, tarelki: { unit: "porsiya" }, likopcha: { unit: "porsiya" }, likop: { unit: "porsiya" },
  plate: { unit: "porsiya" }, serving: { unit: "porsiya" }, servings: { unit: "porsiya" }, portion: { unit: "porsiya" },
  lagan: { unit: "lagan" },
  kosa: { unit: "kosa" }, kosacha: { unit: "kosa" }, miska: { unit: "kosa" }, bowl: { unit: "kosa" },
  piyola: { unit: "piyola" }, piala: { unit: "piyola" }, pialy: { unit: "piyola" },
  stakan: { unit: "stakan" }, stakana: { unit: "stakan" }, glass: { unit: "stakan" }, cup: { unit: "stakan" },
  krujka: { unit: "stakan" }, kruzhka: { unit: "stakan" }, chashka: { unit: "stakan" },
  "bo'lak": { unit: "bolak" }, bolak: { unit: "bolak" }, "bo'lagi": { unit: "bolak" }, tilim: { unit: "bolak" },
  kusok: { unit: "bolak" }, kusochek: { unit: "bolak" }, kuska: { unit: "bolak" }, lomtik: { unit: "bolak" }, slice: { unit: "bolak" },
  oshqoshiq: { unit: "osh_qoshiq" }, qoshiq: { unit: "osh_qoshiq" }, lozhka: { unit: "osh_qoshiq" }, lozhki: { unit: "osh_qoshiq" },
  tbsp: { unit: "osh_qoshiq" }, stlozhka: { unit: "osh_qoshiq" },
  choyqoshiq: { unit: "choy_qoshiq" }, chlozhka: { unit: "choy_qoshiq" }, tsp: { unit: "choy_qoshiq" },
  six: { unit: "six" }, sih: { unit: "six" }, shampur: { unit: "six" }, shampura: { unit: "six" }, skewer: { unit: "six" },
  banka: { unit: "banka" }, can: { unit: "banka" },
  shisha: { unit: "shisha" }, butilka: { unit: "shisha" }, butylka: { unit: "shisha" }, bottle: { unit: "shisha" },
  hovuch: { unit: "hovuch" }, gorst: { unit: "hovuch" }, handful: { unit: "hovuch" },
};

const MULTIWORD_UNITS: [RegExp, string][] = [
  [/\bosh qoshi(q|g'i)\b/g, "oshqoshiq"],
  [/\bchoy qoshi(q|g'i)\b/g, "choyqoshiq"],
  [/\bstolovaya lozhka\b|\bst\. ?lozhk[ai]\b/g, "stlozhka"],
  [/\bchaynaya lozhka\b|\bch\. ?lozhk[ai]\b/g, "chlozhka"],
];

const NUMBER_WORDS: Record<string, number> = {
  bir: 1, ikki: 2, ikkita: 2, uch: 3, uchta: 3, "to'rt": 4, "to'rtta": 4, besh: 5, beshta: 5, olti: 6, yetti: 7,
  sakkiz: 8, "to'qqiz": 9, "o'n": 10, yarim: 0.5, chorak: 0.25, birta: 1, bitta: 1,
  odin: 1, odna: 1, odno: 1, dva: 2, dve: 2, tri: 3, chetyre: 4, "pyat'": 5, pyat: 5, polovina: 0.5, pol: 0.5,
  one: 1, two: 2, three: 3, four: 4, five: 5, half: 0.5,
};

/** Words that carry no meaning for food matching. */
const STOP = new Set([
  "men", "edim", "yedim", "yedik", "ichdim", "ichdik", "bugun", "kecha", "ertalab", "tushlik", "kechki", "ovqat",
  "nonushta", "uchun", "va", "ham", "bilan", "keyin", "yana", "taxminan", "ozroq", "ko'p",
  "ya", "s'el", "syel", "vypil", "na", "zavtrak", "obed", "uzhin", "s",
  "i", "a", "an", "ate", "had", "drank", "for", "breakfast", "lunch", "dinner", "of", "the", "with",
]);

const SPLIT = /[,;\n+]|\s(?:va|hamda|bilan|keyin|i|and|then|plyus)\s/;

// ───────────────────────── food index ─────────────────────────

interface AliasEntry {
  food: Food;
  key: string; // stemmed, apostrophe-free
  words: number;
}

function phraseKey(s: string): string {
  return key(s).split(" ").map(stem).join(" ");
}

const ALIASES: AliasEntry[] = [];
for (const food of FOODS) {
  const all = new Set([...food.aliases, food.name.uz, food.name.ru, food.name.en, food.id.replace(/_/g, " ")]);
  for (const a of all) {
    const k = phraseKey(a.replace(/\(.*?\)/g, ""));
    if (k) ALIASES.push({ food, key: k, words: k.split(" ").length });
  }
}
// Longest aliases first so "qovurma lag'mon" beats "lag'mon".
ALIASES.sort((a, b) => b.key.length - a.key.length);

export interface FoodMatch {
  food: Food;
  confidence: number;
}

/** Match a food phrase ("qovurma lag'mon", "samsa", "лагман") to a food. */
export function matchFood(phrase: string): FoodMatch | null {
  const k = phraseKey(phrase);
  if (!k) return null;
  const padded = ` ${k} `;

  // 1) exact alias, or alias contained as whole words
  for (const a of ALIASES) {
    if (a.key === k) return { food: a.food, confidence: 1 };
  }
  for (const a of ALIASES) {
    if (padded.includes(` ${a.key} `)) return { food: a.food, confidence: 0.95 };
  }

  // 2) fuzzy: compare alias with every same-length word window of the phrase
  const words = k.split(" ");
  let best: FoodMatch | null = null;
  for (const a of ALIASES) {
    for (let n = Math.max(1, a.words - 1); n <= Math.min(words.length, a.words + 1); n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const cand = words.slice(i, i + n).join(" ");
        const len = Math.max(cand.length, a.key.length);
        if (len < 3) continue;
        const dist = editDistance(cand, a.key);
        const allowed = len <= 4 ? 1 : len <= 8 ? 2 : 3;
        if (dist > allowed) continue;
        const confidence = Math.round((1 - dist / len) * 0.9 * 100) / 100;
        if (!best || confidence > best.confidence) best = { food: a.food, confidence };
      }
    }
  }
  return best;
}

/** Autocomplete-style search for food pickers (web, bot, app). */
export function searchFoods(query: string, limit = 10): Food[] {
  const q = key(query);
  if (!q) return [];
  const scored = new Map<string, { food: Food; score: number }>();
  for (const a of ALIASES) {
    let score = 0;
    if (a.key === q) score = 100;
    else if (a.key.startsWith(q)) score = 80 - (a.key.length - q.length) * 0.1;
    else if (a.key.includes(q)) score = 60;
    else if (q.length >= 3) {
      const d = editDistance(q, a.key.slice(0, q.length));
      if (d <= (q.length <= 4 ? 1 : 2)) score = 40 - d * 5;
    }
    if (score > 0) {
      const prev = scored.get(a.food.id);
      if (!prev || prev.score < score) scored.set(a.food.id, { food: a.food, score });
    }
  }
  return [...scored.values()].sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.food);
}

// ───────────────────────── nutrition ─────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scaleMacros(per100: Macros, grams: number): Macros {
  const r = grams / 100;
  const out: Macros = {
    kcal: Math.round(per100.kcal * r),
    protein: round1(per100.protein * r),
    fat: round1(per100.fat * r),
    carbs: round1(per100.carbs * r),
  };
  if (per100.fiber !== undefined) out.fiber = round1(per100.fiber * r);
  return out;
}

export function sumMacros(list: Macros[]): Macros {
  const t = list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs,
      fiber: (acc.fiber ?? 0) + (m.fiber ?? 0),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 } as Macros,
  );
  return { kcal: Math.round(t.kcal), protein: round1(t.protein), fat: round1(t.fat), carbs: round1(t.carbs), fiber: round1(t.fiber ?? 0) };
}

/** Grams for `quantity` of `unit` of a food, falling back to sensible equivalents. */
export function gramsFor(food: Food, quantity: number, unit: UnitKey): { grams: number; unit: UnitKey } {
  if (unit === "g" || unit === "ml") return { grams: quantity, unit };
  const p = food.portions;
  const direct = p[unit];
  if (direct) return { grams: quantity * direct, unit };
  // Fallbacks: a "plate" of soup is a bowl and vice versa, etc.
  const fallbacks: Partial<Record<UnitKey, UnitKey[]>> = {
    porsiya: ["kosa", "lagan", "dona"],
    kosa: ["porsiya", "stakan"],
    lagan: ["porsiya"],
    piyola: ["stakan", "kosa"],
    stakan: ["piyola", "kosa"],
    dona: ["porsiya", "bolak", "six"],
    bolak: ["dona", "porsiya"],
    six: ["porsiya", "dona"],
  };
  for (const alt of fallbacks[unit] ?? []) {
    const g = p[alt];
    if (g) {
      // A "lagan" of a non-osh food is ~3 servings.
      const mult = unit === "lagan" && alt === "porsiya" ? 3 : 1;
      return { grams: quantity * g * mult, unit: alt };
    }
  }
  const def = p[food.defaultUnit] ?? 100;
  return { grams: quantity * def, unit: food.defaultUnit };
}

// ───────────────────────── parsing ─────────────────────────

interface Quantity {
  quantity: number;
  unit?: UnitSpec;
  rest: string[];
}

function parseNumber(tok: string): number | undefined {
  if (/^\d+(\.\d+)?$/.test(tok)) return parseFloat(tok);
  const frac = tok.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return NUMBER_WORDS[tok];
}

function extractQuantity(tokens: string[]): Quantity {
  let quantity: number | undefined;
  let unit: UnitSpec | undefined;
  const rest: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    let tok = tokens[i]!;
    // "300g", "2ta", "0.5l", "x2"
    const glued = tok.match(/^(\d+(?:\.\d+)?)([a-z']+)$/) ?? tok.match(/^(x)(\d+)$/);
    if (glued) {
      const [, a, b] = glued;
      const num = a === "x" ? Number(b) : Number(a);
      const u = a === "x" ? "x" : b!;
      if (UNIT_WORDS[u]) {
        quantity = (quantity ?? 0) + num;
        unit ??= UNIT_WORDS[u];
        continue;
      }
    }
    const n = parseNumber(tok);
    if (n !== undefined) {
      // "bir yarim" / "1 yarim" => 1.5
      if (quantity !== undefined && n === 0.5 && quantity >= 1 && Number.isInteger(quantity)) quantity += 0.5;
      else quantity = n;
      continue;
    }
    if (UNIT_WORDS[tok] && (quantity !== undefined || tok.length > 2) && !(tok === "x" && quantity === undefined)) {
      unit ??= UNIT_WORDS[tok];
      continue;
    }
    if (STOP.has(tok)) continue;
    tok = tok.replace(/^[-'./]+|[-'./]+$/g, "");
    if (tok) rest.push(tok);
  }
  return { quantity: quantity ?? 1, unit, rest };
}

function segments(text: string): string[] {
  let s = ` ${normalize(text)} `;
  for (const [re, rep] of MULTIWORD_UNITS) s = s.replace(re, rep);
  return s
    .split(SPLIT)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Parse free text like "2 ta somsa, 1 kosa lag'mon va 1 piyola choy"
 * (Uzbek Latin/Cyrillic, Russian or English) into foods with nutrition.
 */
export function parseMeal(text: string): ParseResult {
  const items: ParsedItem[] = [];
  const unknown: string[] = [];

  for (const seg of segments(text)) {
    const tokens = seg.split(" ").filter(Boolean);
    const q = extractQuantity(tokens);
    if (!q.rest.length) continue;
    const phrase = q.rest.join(" ");
    const m = matchFood(phrase);
    if (!m) {
      unknown.push(seg);
      continue;
    }
    let unitKey: UnitKey;
    let qty = q.quantity;
    if (q.unit) {
      unitKey = q.unit.unit;
      qty *= q.unit.factor ?? 1;
    } else if (qty >= 20) {
      // "osh 300" -> 300 g
      unitKey = m.food.liquid ? "ml" : "g";
    } else {
      unitKey = m.food.defaultUnit;
    }
    const { grams, unit } = gramsFor(m.food, qty, unitKey);
    items.push({
      input: seg,
      food: m.food,
      quantity: qty,
      unit,
      grams: Math.round(grams),
      nutrition: scaleMacros(m.food.per100, grams),
      confidence: m.confidence,
    });
  }
  return { items, unknown, total: sumMacros(items.map((i) => i.nutrition)) };
}
