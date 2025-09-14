import {
  type NgramOptions,
  type NormalizeOptions,
  type NormalizedString,
  type Token,
  type Levenshtein,
  type AllNgramsOptions,
  asNormalizedString,
  asLevenshtein,
  asToken,
} from './types';

/**
 * Normalise une chaîne de caractères pour comparaison.
 *
 * - retire les accents (NFD + suppression des marques)
 * - met en minuscules (optionnel)
 * - remplace les caractères non alphanumériques par des espaces (optionnel)
 * - réduit les espaces multiples en un seul et tronque
 *
 * @param s Chaîne d'entrée
 * @param opts Options de normalisation
 */
export const normalizeString = (
  s: string,
  opts: NormalizeOptions = {
    toLowerCase: true,
    removeDiacritics: true,
    removePunctuation: true,
    collapseWhitespace: true,
  },
): NormalizedString => {
  let out = String(s ?? '');
  if (opts.removeDiacritics) {
    out = out.normalize('NFD').replace(/\p{M}/gu, '');
  }
  if (opts.toLowerCase) {
    out = out.toLowerCase();
  }
  if (opts.removePunctuation) {
    // Keep letters and numbers; replace other chars with space
    out = out.replace(/[^\p{L}\p{N}]+/gu, ' ');
  }
  if (opts.collapseWhitespace) {
    out = out.replace(/\s+/g, ' ').trim();
  }
  return asNormalizedString(out);
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes de caractères.
 *
 * SYNOPSIS
 *
 * La distance de Levenshtein est le nombre minimum d'opérations requises pour transformer
 * une chaîne en une autre, les opérations étant l'insertion, la suppression ou la substitution
 * d'un caractère.
 *
 * Interprétation rapide :
 * - Une distance de 0 signifie que les chaînes sont identiques.
 * - Une petite distance (1-3) indique que les chaînes sont très similaires.
 * - Une distance proche de la longueur des chaînes suggère qu'elles sont très différentes.
 *
 * Cas pratiques / utilité :
 * - Correction orthographique : trouver des mots proches d'un mot mal orthographié.
 * - Regroupement de labels similaires : identifier des variantes proches dans des noms ou adresses.
 * - Filtrage de doublons "proches" avant clustering : éviter les répétitions quasi-identiques.
 *
 * Notes finales :
 * - L'algorithme utilisé est une approche de programmation dynamique avec une complexité en temps O(m*n)
 *   et en espace O(m*n), où m et n sont les longueurs des deux chaînes.
 * - Pour des chaînes très longues, des versions optimisées en espace O(min(m,n)) existent.
 * - La distance de Levenshtein est robuste pour détecter de petits changements, mais peut être coûteuse à grande échelle.
 *
 * @param a La première chaîne.
 * @param b La deuxième chaîne.
 * @returns La distance de Levenshtein entre les deux chaînes.
 *
 * @example
 * const distance = levenshtein('chat', 'chats');
 * console.log(distance); // 1
 */

export const levenshtein = (a: string, b: string): Levenshtein => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const result = dp[m][n];
  return asLevenshtein(result);
};

/**
 * Génère tous les n-grams de taille `n` pour une chaîne donnée, sans gestion des doublons
 *
 * Comportement par défaut : normalise la chaîne (minuscules, suppression des diacritiques,
 * suppression de la ponctuation, collapse des espaces), supprime les espaces, puis
 * génère des n-grams de caractères.
 *
 * @param s Chaîne d'entrée
 * @param n Taille des n-grams (par défaut : 3)
 * @param opts Options de génération
 * @returns Tableau de n-grams (chaînes)
 *
 * @example
 * ngrams('abcde', 3) // ['abc','bcd','cde']
 */
export const ngrams = (
  s: string,
  n: number,
  opts: NgramOptions = { normalize: true, pad: false, padChar: '_', preserveWhitespace: false },
): Token[] => {
  if (s.length < 1) return [];
  const size = Math.max(1, Math.min(10, Math.floor(n), s.length));
  let str = String(s ?? '');

  if (opts.normalize ?? true) {
    str = normalizeString(str, opts.normalizeOpts ?? undefined);
  }

  if (!opts.preserveWhitespace) {
    str = str.replace(/\s+/g, '');
  }

  if (opts.pad) {
    const padChar = (opts.padChar ?? '_') || '_';
    const pad = padChar.repeat(Math.max(0, size - 1));
    str = pad + str + pad;
  }

  const out: Token[] = [];
  if (str.length === 0) return out;

  if (str.length <= size) {
    out.push(asToken(str));
    return out;
  }

  for (let i = 0; i <= str.length - size; i++) {
    out.push(asToken(str.substring(i, i + size)));
  }
  return out;
};

export const allNgrams = (s: string, opts?: AllNgramsOptions): Token[] => {
  opts = opts || {};
  opts.minN = opts.minN ?? 1;
  opts.maxN = opts.maxN ?? Math.min(10, s.length);
  if (s.length < 1 || opts.minN > opts.maxN) return [];
  const out: Token[] = [];
  for (let n = opts.minN; n <= opts.maxN; n++) {
    const toks = ngrams(s, n, opts.ngramOptions);
    for (const t of toks) out.push(t);
  }
  return out;
};
