import { asToken } from '../src/types';
import {
  tokensCorpus,
  tfCorpus,
  vocabulary,
  idf,
  tfidfCorpus,
  softmaxTfidf,
  sparseToDense,
  asFrequency,
  dominantTopicIndexForOneDocument,
  dominantDocumentIndexForOneTopic,
  documentsForOneDominantTopic,
  groupMultiSelect,
} from '../src';
import { DenseMatrix } from '@univ-lehavre/ts-matrix';

describe('embeddings', () => {
  it('tokensCorpus gère un corpus vide', () => {
    const toks = tokensCorpus([], { minN: 2, maxN: 2 });
    expect(toks).toEqual([]);
  });

  it('tokensCorpus gère les options avancées', () => {
    const corpus = ['École', 'abc'];
    const toks = tokensCorpus(corpus, {
      minN: 2,
      maxN: 3,
      ngramOptions: { normalize: true, pad: true, padChar: '*', preserveWhitespace: true },
    });
    expect(toks.length).toBe(2);
    expect(toks[0].some(t => typeof t === 'string')).toBe(true);
    expect(toks[1].some(t => typeof t === 'string')).toBe(true);
  });

  it('tfCorpus gère un document vide', () => {
    const tf = tfCorpus([[]]);
    expect(tf[0].size).toBe(0);
  });

  it('tfCorpus gère plusieurs documents', () => {
    const toks = [
      [asToken('a'), asToken('b')],
      [asToken('b'), asToken('c')],
    ];
    const tf = tfCorpus(toks);
    expect(tf.length).toBe(2);
    expect(tf[0].get(asToken('a'))).toBeCloseTo(0.5);
    expect(tf[1].get(asToken('c'))).toBeCloseTo(0.5);
  });

  it('vocabulary gère un corpus vide', () => {
    const vocab = vocabulary([]);
    expect(vocab).toEqual([]);
  });

  it('idf gère un vocabulaire vide', () => {
    const tf = [new Map([[asToken('a'), asFrequency(1)]])];
    const idfMap = idf(tf, []);
    expect(idfMap.size).toBe(0);
  });

  it('idf gère un corpus vide', () => {
    const idfMap = idf([], [asToken('a')]);
    expect(idfMap.get(asToken('a'))).toBeGreaterThan(0);
  });

  it('tfidfCorpus gère un corpus et vocabulaire vides', () => {
    const tfidf = tfidfCorpus([], []);
    expect(tfidf).toEqual([]);
  });

  it('tfidfCorpus gère des tokens absents du vocabulaire', () => {
    const tf = [new Map([[asToken('x'), asFrequency(1)]])];
    const vocab = [asToken('a')];
    const tfidf = tfidfCorpus(tf, vocab);
    expect(tfidf[0].get(asToken('a'))).toBeUndefined();
  });

  it('softmaxTfidf gère un tableau vide', () => {
    const result = softmaxTfidf([]);
    expect(result).toEqual([]);
  });

  it('softmaxTfidf gère des valeurs nulles', () => {
    const doc = new Map([
      [asToken('a'), 0],
      [asToken('b'), 0],
    ]);
    const result = softmaxTfidf([doc])[0];
    expect(Array.from(result.values()).reduce((acc, v) => acc + v, 0)).toBeCloseTo(1);
  });

  it('sparseToDense gère un document avec des tokens absents du vocabulaire', () => {
    const vocab = [asToken('a'), asToken('b')];
    const docs = [new Map([[asToken('c'), 5]])];
    const dense = sparseToDense(docs, vocab);
    expect(dense).toEqual([[0, 0]]);
  });

  it('sparseToDense gère un tableau de documents vide', () => {
    const vocab = [asToken('a'), asToken('b')];
    const dense = sparseToDense([], vocab);
    expect(dense).toEqual([]);
  });
  it('tokensCorpus génère les bons ngrams', () => {
    const corpus = ['abc', 'bcd'];
    const toks = tokensCorpus(corpus, { minN: 2, maxN: 2 });
    expect(toks.length).toBe(2);
    expect(toks[0].map(t => t as string)).toEqual(['ab', 'bc']);
    expect(toks[1].map(t => t as string)).toEqual(['bc', 'cd']);
  });

  it('tfCorpus calcule les fréquences', () => {
    const toks = [[asToken('a'), asToken('b'), asToken('a')]];
    const tf = tfCorpus(toks);
    expect(tf[0].get(asToken('a'))).toBeCloseTo(2 / 3);
    expect(tf[0].get(asToken('b'))).toBeCloseTo(1 / 3);
  });

  it('vocabulary extrait tous les tokens uniques', () => {
    const tf = [
      new Map([
        [asToken('a'), asFrequency(1)],
        [asToken('b'), asFrequency(2)],
      ]),
    ];
    const vocab = vocabulary(tf);
    expect(vocab.map(t => t as string)).toEqual(expect.arrayContaining(['a', 'b']));
  });

  it('idf calcule les bons scores', () => {
    const tf = [
      new Map([[asToken('a'), asFrequency(1)]]),
      new Map([
        [asToken('a'), asFrequency(1)],
        [asToken('b'), asFrequency(1)],
      ]),
    ];
    const vocab = [asToken('a'), asToken('b')];
    const idfMap = idf(tf, vocab);
    expect(idfMap.get(asToken('a'))).toBeGreaterThan(0);
    expect(idfMap.get(asToken('b'))).toBeGreaterThan(0);
  });

  it('tfidfCorpus combine tf et idf', () => {
    const tf = [new Map([[asToken('a'), asFrequency(1)]])];
    const vocab = [asToken('a')];
    const tfidf = tfidfCorpus(tf, vocab);
    expect(tfidf.length).toBe(1);
    expect(tfidf[0].get(asToken('a'))).toBeGreaterThan(0);
  });

  it('softmaxTfidf normalise en probabilités', () => {
    const doc = new Map([
      [asToken('a'), 1],
      [asToken('b'), 2],
    ]);
    const result = softmaxTfidf([doc])[0];
    const sum = Array.from(result.values()).reduce((acc, v) => acc + v, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('sparseToDense convertit correctement', () => {
    const vocab = [asToken('a'), asToken('b')];
    const docs = [new Map([[asToken('a'), 1]])];
    const dense = sparseToDense(docs, vocab);
    expect(dense).toEqual([[1, 0]]);
  });

  it("dominantTopicIndexForOneDocument retourne l'indice du topic dominant", () => {
    // Crée une matrice 3 documents x 4 topics
    // document 0: topic 1 est maximal
    // document 1: topic 2 est maximal
    // document 2: topics 0 et 3 partagent le max -> on attend un des deux
    const matrixData = [
      [0.1, 0.9, 0.2, 0.0],
      [0.0, 0.2, 0.8, 0.1],
      [0.5, 0.1, 0.2, 0.5],
    ];
    // Importer DenseMatrix dynamiquement pour éviter erreurs d'import top-level
    const dm = new DenseMatrix(matrixData, { nonNegative: true });
    const idx0 = dominantTopicIndexForOneDocument(dm, 0);
    const idx1 = dominantTopicIndexForOneDocument(dm, 1);
    const idx2 = dominantTopicIndexForOneDocument(dm, 2);
    expect(idx0).toBe(1);
    expect(idx1).toBe(2);
    expect([0, 3]).toContain(idx2);
  });

  it("dominantTopicIndexForOneDocument l'ève une erreur pour index hors limites", () => {
    // matrice 1x2
    const matrixData = [[0.1, 0.9]];
    const dm = new DenseMatrix(matrixData, { nonNegative: true });
    expect(() => dominantTopicIndexForOneDocument(dm, -1)).toThrow();
    expect(() => dominantTopicIndexForOneDocument(dm, 5)).toThrow();
  });

  it('documentsForOneDominantTopic retourne les documents du topic demandé', () => {
    // Crée une matrice 4 documents x 3 topics
    // doc0 -> topic0 dominant
    // doc1 -> topic1 dominant
    // doc2 -> topic0 dominant
    // doc3 -> topic2 dominant
    const matrixData = [
      [0.9, 0.1, 0.0],
      [0.0, 0.8, 0.2],
      [0.7, 0.2, 0.1],
      [0.1, 0.0, 0.9],
    ];
    const dm = new DenseMatrix(matrixData, { nonNegative: true });
    const corpus = ['doc0', 'doc1', 'doc2', 'doc3'];

    const docsTopic0 = documentsForOneDominantTopic(dm, 0, corpus);
    const docsTopic1 = documentsForOneDominantTopic(dm, 1, corpus);
    const docsTopic2 = documentsForOneDominantTopic(dm, 2, corpus);

    expect(docsTopic0.sort()).toEqual(['doc0', 'doc2'].sort());
    expect(docsTopic1).toEqual(['doc1']);
    expect(docsTopic2).toEqual(['doc3']);
  });

  it('documentsForOneDominantTopic lève une erreur pour index de topic hors limites', () => {
    const matrixData = [[0.5, 0.5]]; // 1x2
    const dm = new DenseMatrix(matrixData, { nonNegative: true });
    const corpus = ['only'];
    expect(() => documentsForOneDominantTopic(dm, -1, corpus)).toThrow();
    expect(() => documentsForOneDominantTopic(dm, 5, corpus)).toThrow();
  });

  it("dominantDocumentIndexForOneTopic retourne l'indice du document dominant (cas simple et tie)", () => {
    // Matrice 3 documents x 2 topics
    // colonne 0 : max en doc0
    // colonne 1 : max en doc2
    const matrixData = [
      [0.9, 0.1],
      [0.8, 0.2],
      [0.1, 0.9],
    ];
    const dm = new DenseMatrix(matrixData, { nonNegative: true });

    const idxCol0 = dominantDocumentIndexForOneTopic(dm, 0);
    const idxCol1 = dominantDocumentIndexForOneTopic(dm, 1);

    expect(idxCol0).toBe(0);
    expect(idxCol1).toBe(2);

    // Cas d'égalité (tie) pour la colonne 0 entre doc0 et doc1
    const tieData = [
      [0.5, 0.2],
      [0.5, 0.1],
      [0.1, 0.7],
    ];
    const dmTie = new DenseMatrix(tieData, { nonNegative: true });
    const tieIdx = dominantDocumentIndexForOneTopic(dmTie, 0);
    expect([0, 1]).toContain(tieIdx);
  });

  it('dominantDocumentIndexForOneTopic lève une erreur pour index de topic hors limites', () => {
    const matrixData = [[0.1, 0.9]]; // 1x2
    const dm = new DenseMatrix(matrixData, { nonNegative: true });
    expect(() => dominantDocumentIndexForOneTopic(dm, -1)).toThrow();
    expect(() => dominantDocumentIndexForOneTopic(dm, 5)).toThrow();
  });

  it('groupMultiSelect regroupe correctement les documents par topic dominant', () => {
    // matrice 4 documents x 3 topics
    const matrixData = [
      [0.9, 0.1, 0.0], // doc0 -> topic0
      [0.0, 0.8, 0.2], // doc1 -> topic1
      [0.7, 0.2, 0.1], // doc2 -> topic0
      [0.1, 0.0, 0.9], // doc3 -> topic2
    ];
    const dm = new DenseMatrix(matrixData, { nonNegative: true });
    const corpus = ['doc0', 'doc1', 'doc2', 'doc3'];

    const grouped = groupMultiSelect(dm, corpus);

    // vérifier que les clés contiennent les titres dominants
    const keys = Object.keys(grouped);
    // Les titres doivent être les documents dominants pour chaque topic
    expect(keys).toEqual(expect.arrayContaining([corpus[0], corpus[1], corpus[3]]));

    // vérifier que les listes contiennent les bons documents
    expect(grouped[corpus[0]].sort()).toEqual(['doc0', 'doc2'].sort());
    expect(grouped[corpus[1]]).toEqual(['doc1']);
    expect(grouped[corpus[3]]).toEqual(['doc3']);
  });
});
