import { Brand } from 'effect';

/**
 * Options pour la normalisation de chaînes.
 *
 * Ces options contrôlent les étapes appliquées par `normalizeString`.
 * Toutes les propriétés sont facultatives : la fonction appelante fournit
 * des valeurs par défaut si nécessaire.
 *
 * Exemples d'utilisation :
 * - comparer deux chaînes utilisateur indépendamment des accents et de la casse;
 * - préparer des étiquettes pour la génération de n-grams.
 *
 * @example
 * const opts: NormalizeOptions = { toLowerCase: true, removeDiacritics: true };
 */
export interface NormalizeOptions {
  /**
   * Convertit la chaîne en minuscules avant toute autre opération.
   * @default true
   */
  toLowerCase?: boolean;

  /**
   * Supprime les diacritiques (accents) en appliquant une normalisation Unicode
   * (NFD) puis en retirant les marques combinantes. Utile pour comparer
   * "École" et "Ecole".
   * @default true
   */
  removeDiacritics?: boolean;

  /**
   * Remplace la ponctuation et les caractères non alphanumériques par des espaces.
   * Permet d'uniformiser les séparateurs (virgules, points, tirets...).
   * @default true
   */
  removePunctuation?: boolean;

  /**
   * Réduit les séquences d'espaces (tabs, retours ligne...) en un seul espace,
   * puis tronque les espaces en début/fin.
   * @default true
   */
  collapseWhitespace?: boolean;
}

/**
 * Options pour la génération de n-grams à partir d'une chaîne.
 *
 * Définit si la chaîne doit être normalisée avant génération, si un padding est
 * ajouté aux bords, et quel caractère utiliser pour le padding. Permet aussi de
 * conserver ou non les espaces lors de la tokenisation.
 *
 * @example
 * const opts: NgramOptions = { normalize: true, pad: true, padChar: '_' };
 */
export type NgramOptions = {
  /**
   * Si true, applique `normalizeString` avant de générer les n-grams.
   * @default true
   */
  normalize?: boolean;

  /**
   * Si true, ajoute un padding en début et fin pour inclure les bords dans les n-grams
   * (utile pour capturer les préfixes/suffixes). Ex : padChar='_' et n=3 => '__a', '_ab'.
   * @default false
   */
  pad?: boolean;

  /**
   * Caractère utilisé pour le padding.
   * @default '_'
   */
  padChar?: string;

  /**
   * Si true, conserve les espaces dans la chaîne avant génération; sinon les espaces
   * sont supprimés. Conserver les espaces permet d'avoir des tokens centrés sur les mots.
   * @default false
   */
  preserveWhitespace?: boolean;

  /**
   * Options passées à `normalizeString` si `normalize` est true.
   */
  normalizeOpts?: NormalizeOptions;
};

/**
 * Type brandé représentant une chaîne préalablement normalisée.
 *
 * Utiliser ce type pour indiquer au typage que la chaîne a subi la
 * transformation `normalizeString`. Cela évite les confusions entre une
 * string brute et une string normalisée.
 *
 * Exemple :
 * const normalized = normalizeString(raw) as NormalizedString;
 */
export type NormalizedString = string & Brand.Brand<'NormalizedString'>;
export const asNormalizedString = Brand.nominal<NormalizedString>();

/**
 * Type brandé représentant une liste de n-grams (tokens).
 *
 * Chaque élément correspond à un token extrait d'une chaîne (ex. ['_ab', 'abc', 'bc_']).
 */
export type Token = string & Brand.Brand<'Token'>;
export const asToken = Brand.nominal<Token>();
export type Ngrams = Token[] & Brand.Brand<'Ngrams'>;
export const asNgrams = Brand.nominal<Ngrams>();

/**
 * Type brandé pour la distance de Levenshtein entre deux chaînes.
 *
 * Valeur entière >= 0. La borne supérieure dépend des longueurs comparées.
 */
export type Levenshtein = number & Brand.Brand<'Levenshtein'>;
export const asLevenshtein = Brand.nominal<Levenshtein>();

export interface AllNgramsOptions {
  minN?: number;
  maxN?: number;
  ngramOptions?: NgramOptions;
}
