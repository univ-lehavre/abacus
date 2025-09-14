import { levenshtein, ngrams, normalizeString, allNgrams } from '../src/utils';

describe('normalizeString', () => {
  it('ne modifie pas la chaîne si toutes les options sont à false', () => {
    expect(
      normalizeString('École, 42!', {
        toLowerCase: false,
        removeDiacritics: false,
        removePunctuation: false,
        collapseWhitespace: false,
      }),
    ).toBe('École, 42!');
  });

  it('gère la ponctuation', () => {
    expect(
      normalizeString('A.B,C', {
        toLowerCase: false,
        removeDiacritics: false,
        removePunctuation: true,
        collapseWhitespace: false,
      }),
    ).toBe('A B C');
  });

  it('gère la suppression des diacritiques uniquement', () => {
    expect(
      normalizeString('École', {
        toLowerCase: false,
        removeDiacritics: true,
        removePunctuation: false,
        collapseWhitespace: false,
      }),
    ).toBe('Ecole');
  });

  it('gère la conversion en minuscules uniquement', () => {
    expect(
      normalizeString('École', {
        toLowerCase: true,
        removeDiacritics: false,
        removePunctuation: false,
        collapseWhitespace: false,
      }),
    ).toBe('école');
  });

  it('gère la collapseWhitespace uniquement', () => {
    expect(
      normalizeString('A   B   C', {
        toLowerCase: false,
        removeDiacritics: false,
        removePunctuation: false,
        collapseWhitespace: true,
      }),
    ).toBe('A B C');
  });
  it('supprime les diacritiques et met en minuscules', () => {
    expect(normalizeString('École')).toBe('ecole');
    expect(normalizeString('École', { toLowerCase: true, removeDiacritics: true })).toBe('ecole');
  });

  it('remplace la ponctuation par des espaces et collapse les espaces', () => {
    expect(
      normalizeString('Normandie Univ, UNILEHAVRE, FR 3038 CNRS, URCOM, 76600 Le Havre, France', {
        removePunctuation: true,
        collapseWhitespace: true,
      }),
    ).toBe('Normandie Univ UNILEHAVRE FR 3038 CNRS URCOM 76600 Le Havre France');
  });

  it('gère les caractères spéciaux et retours à la ligne', () => {
    expect(normalizeString('URCOM - Unité de Recherche en Chimie\nOrganique')).toBe(
      'urcom unite de recherche en chimie organique',
    );
    expect(normalizeString('  A   B  ')).toBe('a b');
    expect(normalizeString('Room #42, Bldg. 7')).toBe('room 42 bldg 7');
    expect(normalizeString('Université Le Havre Normandie, Équipe de Recherche')).toBe(
      'universite le havre normandie equipe de recherche',
    );
  });
});

describe('levenshtein', () => {
  it('renvoie 0 pour deux chaînes identiques', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });

  it('renvoie la longueur pour une chaîne vide', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('calcule correctement la distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('flaw', 'lawn')).toBe(2);
    expect(levenshtein('gumbo', 'gambol')).toBe(2);
  });

  it('gère des chaînes longues et complexes', () => {
    expect(
      levenshtein(
        'Institut Européen des Membranes, Centre National de la Recherche Scientifique, 1919, Route de Mende, 34293 Montpellier Cedex 5, France',
        'IEM-CNRS, 1919, route de Mende, 34293 Montpellier cedex 5, France',
      ),
    ).toBeGreaterThan(10);

    expect(
      levenshtein(
        'Normandie Univ UNIHAVRE FR 3038 CNRS URCOM 76600 Le Havre France',
        'Normandie Univ, UNILEHAVRE, FR 3038 CNRS, URCOM, 76600 Le Havre, France',
      ),
    ).toBeGreaterThan(5);

    expect(
      levenshtein(
        'URCOM, Université du Havre, 25 rue Philippe Lebon, BP 540, 76058 Le Havre cedex, France.',
        'URCOM Université du Havre  EA 3221 FR CNRS 3038 25 rue Philippe Lebon B.P. 540 76058 Le Havre Cedex France',
      ),
    ).toBeGreaterThan(10);
  });
});

describe('ngrams', () => {
  it('retourne [] pour une chaîne vide', () => {
    expect(ngrams('', 3)).toEqual([]);
  });

  it('retourne le ngram unique si la chaîne est plus courte que n', () => {
    expect(ngrams('ab', 3)).toEqual(['ab']);
  });

  it('pad avec un autre caractère', () => {
    expect(ngrams('abc', 2, { pad: true, padChar: '*' })).toEqual(['*a', 'ab', 'bc', 'c*']);
  });

  it('utilise normalizeOpts pour la normalisation', () => {
    expect(
      ngrams('École', 2, {
        normalize: true,
        normalizeOpts: { toLowerCase: false, removeDiacritics: true },
      }),
    ).toEqual(['Ec', 'co', 'ol', 'le']);
  });

  it('conserve les espaces si preserveWhitespace', () => {
    expect(ngrams('a b', 2, { preserveWhitespace: true })).toEqual(['a ', ' b']);
  });
  it('génère des n-grams simples', () => {
    expect(ngrams('abcde', 3)).toEqual(['abc', 'bcd', 'cde']);
    expect(ngrams('abcde', 3, { normalize: false })).toEqual(['abc', 'bcd', 'cde']);
  });

  it('pad ajoute des bordures', () => {
    expect(ngrams('abc', 3, { pad: true, padChar: '_' })).toEqual([
      '__a',
      '_ab',
      'abc',
      'bc_',
      'c__',
    ]);
  });

  it('enlève les espaces par défaut et normalise', () => {
    expect(ngrams('Écôle  1', 2)).toEqual(['ec', 'co', 'ol', 'le', 'e1']);
    expect(ngrams('Écôle  1', 2, { normalize: true })).toEqual(['ec', 'co', 'ol', 'le', 'e1']);
  });

  it('preserveWhitespace true conserve les espaces', () => {
    expect(ngrams('a b c', 2, { preserveWhitespace: true, normalize: true })).toEqual([
      'a ',
      ' b',
      'b ',
      ' c',
    ]);
  });
});

describe('allNgrams', () => {
  it('retourne [] si la chaîne est vide', () => {
    expect(allNgrams('', { minN: 1, maxN: 3 })).toEqual([]);
  });

  it('retourne [] si minN > maxN', () => {
    expect(allNgrams('abc', { minN: 4, maxN: 2 })).toEqual([]);
  });

  it('utilise ngramOptions pour la normalisation', () => {
    const toks = allNgrams('École', {
      minN: 2,
      maxN: 2,
      ngramOptions: {
        normalize: true,
        normalizeOpts: { toLowerCase: false, removeDiacritics: true },
      },
    });
    expect(toks).toEqual(['Ec', 'co', 'ol', 'le']);
  });

  it("génère l'ensemble attendu pour minN=1 et maxN=2", () => {
    const toks = allNgrams('abc', { minN: 1, maxN: 2 });
    // Convertir en tableau trié pour comparaison déterministe
    const got = Array.from(toks).sort();
    expect(got).toEqual(['a', 'ab', 'b', 'bc', 'c'].sort());
  });
});
