/**
 * Text normalisation so that "Lag‘mon", "lagmon", "ЛАГМОН", "лағмон" and
 * "лагман" all end up in one comparable Latin form.
 */

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "g'", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ў: "o'", ф: "f", х: "x", ҳ: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "'", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ә: "a", ө: "o", ү: "u",
  ң: "ng", і: "i",
};

const APOSTROPHES = /[‘’ʻʼ`´′]/g;

/** Lowercase, unify apostrophes, transliterate Cyrillic to Uzbek Latin. */
export function normalize(input: string): string {
  let s = input.normalize("NFKC").toLowerCase().replace(APOSTROPHES, "'");
  let out = "";
  for (const ch of s) out += CYR[ch] ?? ch;
  s = out
    // decimal comma -> dot so "1,5" is not split into two items
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[^\p{L}\p{N}'./\s,;+-]/gu, " ")
    .replace(/[^\S\n]+/g, " ")
    .trim();
  return s;
}

/** Same as normalize, plus apostrophes and hyphens dropped: used as a match key. */
export function key(input: string): string {
  return normalize(input).replace(/['-]/g, "").replace(/[,;+\n]/g, " ").replace(/\s+/g, " ").trim();
}

const SUFFIXES = ["larning", "lardan", "larni", "larga", "lari", "lar", "ning", "dan", "ni", "ga", "da", "dagi", "im", "imni"];

/** Strip common Uzbek grammatical suffixes: "somsalarni" -> "somsa". */
export function stem(word: string): string {
  for (const suf of SUFFIXES) {
    if (word.length - suf.length >= 3 && word.endsWith(suf)) return word.slice(0, -suf.length);
  }
  return word;
}

/** Damerau-Levenshtein (optimal string alignment) distance. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}
