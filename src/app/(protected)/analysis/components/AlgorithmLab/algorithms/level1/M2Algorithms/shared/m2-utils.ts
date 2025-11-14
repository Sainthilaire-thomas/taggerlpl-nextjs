// algorithms/level1/M2Algorithms/m2-utils.ts
const FR_STOPWORDS = new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "de",
  "du",
  "au",
  "aux",
  "à",
  "et",
  "ou",
  "mais",
  "je",
  "tu",
  "il",
  "elle",
  "nous",
  "vous",
  "ils",
  "elles",
  "on",
  "me",
  "te",
  "se",
  "est",
  "suis",
  "es",
  "sommes",
  "êtes",
  "sont",
  "ai",
  "as",
  "avons",
  "avez",
  "ont",
  "ne",
  "pas",
  "plus",
  "moins",
  "que",
  "qui",
  "quoi",
  "où",
  "quand",
  "comment",
  "pour",
  "dans",
  "sur",
  "par",
  "avec",
  "sans",
  "ce",
  "cette",
  "ces",
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "son",
  "sa",
  "ses",
  "leur",
  "leurs",
  "y",
  "en",
  "d'",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const norm = normalize(text);
  return norm.split(/\s+/).filter((t) => t && !FR_STOPWORDS.has(t));
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export function shared(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const t of a) if (b.has(t)) out.push(t);
  return out;
}
