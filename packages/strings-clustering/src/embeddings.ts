import { Brand } from 'effect';
import { allNgrams } from './utils';
import { type AllNgramsOptions, type Token } from './types';
import { DenseMatrix, nnmf } from '@univ-lehavre/ts-matrix';

export const tokensCorpus = (corpus: string[], opts?: AllNgramsOptions): Token[][] => {
  const results: Token[][] = [];
  for (const doc of corpus) {
    const toks = allNgrams(doc, opts);
    results.push(toks);
  }
  return results;
};

export type Frequency = number & Brand.Brand<'Frequency'>;
export const asFrequency = Brand.nominal<Frequency>();
export type TfCorpus = Frequency[][] & Brand.Brand<'TfCorpus'>;
export const asTfCorpus = Brand.nominal<TfCorpus>();

export const tfCorpus = (tokensCorpus: Token[][]): Map<Token, Frequency>[] => {
  const countsCorpus: Map<Token, Frequency>[] = [];
  for (const doc of tokensCorpus) {
    const counts = new Map<Token, number>();
    const tf = new Map<Token, Frequency>();
    for (const t of doc) counts.set(t, (counts.get(t) ?? 0) + 1);
    const total = doc.length;
    for (const [t, c] of counts.entries()) tf.set(t, asFrequency(c / total));
    countsCorpus.push(tf);
  }
  return countsCorpus;
};

export const vocabulary = (tfCorpus: Map<Token, Frequency>[]): Token[] => {
  const vocabSet = new Set<Token>();
  for (const doc of tfCorpus) {
    for (const token of doc.keys()) {
      vocabSet.add(token);
    }
  }
  return Array.from(vocabSet);
};

export const idf = (tfCorpus: Map<Token, Frequency>[], vocabulary: Token[]): Map<Token, number> => {
  const df = new Map<Token, number>();
  for (const token of vocabulary) {
    for (const doc of tfCorpus) {
      if (doc.has(token)) {
        df.set(token, (df.get(token) ?? 0) + 1);
      }
    }
  }
  const idf = new Map<Token, number>();
  const N = tfCorpus.length;
  for (const token of vocabulary) {
    const docFreq = df.get(token) ?? 0;
    idf.set(token, Math.log((N + 1) / (docFreq + 1)) + 1);
  }
  return idf;
};

export const tfidfCorpus = (
  tfCorpus: Map<Token, Frequency>[],
  vocabulary: Token[],
): Map<Token, number>[] => {
  const idfValues = idf(tfCorpus, vocabulary);
  const tfidfCorpus: Map<Token, number>[] = [];
  for (const doc of tfCorpus) {
    const tfidfDoc = new Map<Token, number>();
    for (const [token, tf] of doc.entries()) {
      const idfValue = idfValues.get(token) ?? 0;
      tfidfDoc.set(token, tf * idfValue);
    }
    tfidfCorpus.push(tfidfDoc);
  }
  return tfidfCorpus;
};

/**
 * Applique la normalisation softmax à chaque document TF-IDF.
 * @param tfidfDocs Tableau de Map<Token, number> (documents TF-IDF)
 * @returns Tableau de Map<Token, number> où chaque document est normalisé softmax
 */
export const softmaxTfidf = (tfidfDocs: Map<Token, number>[]): Map<Token, number>[] => {
  return tfidfDocs.map(doc => {
    // Pour la stabilité numérique, soustraire le max avant l'exponentielle
    const values = Array.from(doc.values());
    const maxVal = Math.max(...values);
    const expValues = values.map(v => Math.exp(v - maxVal));
    const sumExp = expValues.reduce((acc, v) => acc + v, 0);
    const tokens = Array.from(doc.keys());
    const normalized = new Map<Token, number>();
    for (let i = 0; i < tokens.length; i++) {
      normalized.set(tokens[i], expValues[i] / sumExp);
    }
    return normalized;
  });
};

// Une fonction transformant une matrice sparse Map<Token, number>[] en une matrice dense number[][]
export const sparseToDense = (
  sparseDocs: Map<Token, number>[],
  vocabulary: Token[],
): number[][] => {
  const denseDocs: number[][] = [];
  const tokenIndex = new Map<Token, number>();
  vocabulary.forEach((token, idx) => tokenIndex.set(token, idx));
  for (const doc of sparseDocs) {
    const denseDoc = new Array(vocabulary.length).fill(0);
    for (const [token, value] of doc.entries()) {
      const idx = tokenIndex.get(token);
      if (idx !== undefined) {
        denseDoc[idx] = value;
      }
    }
    denseDocs.push(denseDoc);
  }
  return denseDocs;
};

// applique la fonction nnmf de la librairie ts-matrix pour factoriser tfidfCorpus
// en deux matrices de rang réduit (documents x topics) et (topics x terms)
// tfidfCorpus est d’abord normalisé en probabilités puis est densifié avec sparseToDense
export const reduceDimensionality = (
  corpus: string[],
  nTopics: number,
  opts?: AllNgramsOptions,
): { docTopicMatrix: DenseMatrix; topicTokenMatrix: DenseMatrix } => {
  if (tfidfCorpus.length === 0 || vocabulary.length === 0) {
    return { docTopicMatrix: new DenseMatrix([]), topicTokenMatrix: new DenseMatrix([]) };
  }
  const tokens = tokensCorpus(corpus, opts);
  const tf = tfCorpus(tokens);
  const vocab = vocabulary(tf);
  const tfidf = tfidfCorpus(tf, vocab);
  const tfidfSoftmax = softmaxTfidf(tfidf);
  const denseMatrix = sparseToDense(tfidfSoftmax, vocab);
  const matrix = new DenseMatrix(denseMatrix, { nonNegative: true });
  // Application de la factorisation NNMF
  const [W, H] = nnmf(matrix, nTopics);

  return { docTopicMatrix: W, topicTokenMatrix: H };
};

export const dominantTopicIndexForOneDocument = (
  docTopicMatrix: DenseMatrix,
  docIndex: number,
): number => {
  if (docIndex < 0 || docIndex >= docTopicMatrix.nRows)
    throw new Error('Index de document hors limites');
  const data = docTopicMatrix.getRow(docIndex);
  const max = Math.max(...data);
  const maxIndices = data.map((v, i) => (v === max ? i : -1)).filter(i => i !== -1);
  return maxIndices[(Math.random() * maxIndices.length) | 0];
};

export const documentsForOneDominantTopic = (
  docTopicMatrix: DenseMatrix,
  topicIndex: number,
  corpus: string[],
): string[] => {
  if (topicIndex < 0 || topicIndex >= docTopicMatrix.nCols)
    throw new Error('Index de topic hors limites');
  const docs: string[] = [];
  for (let i = 0; i < docTopicMatrix.nRows; i++) {
    if (topicIndex === dominantTopicIndexForOneDocument(docTopicMatrix, i)) {
      docs.push(corpus[i]);
    }
  }
  return docs;
};

export const dominantDocumentIndexForOneTopic = (
  docTopicMatrix: DenseMatrix,
  topicIndex: number,
): number => {
  if (topicIndex < 0 || topicIndex >= docTopicMatrix.nCols)
    throw new Error('Index de topic hors limites');
  const data = docTopicMatrix.getCol(topicIndex);
  const max = Math.max(...data);
  const maxIndices = data.map((v, i) => (v === max ? i : -1)).filter(i => i !== -1);
  return maxIndices[(Math.random() * maxIndices.length) | 0];
};

export const groupMultiSelect = (docTopicMatrix: DenseMatrix, corpus: string[]) => {
  const result: Record<string, string[]> = {};
  for (let j = 0; j < docTopicMatrix.nCols; j++) {
    const topicDocs = documentsForOneDominantTopic(docTopicMatrix, j, corpus);
    const topicTitle = corpus[dominantDocumentIndexForOneTopic(docTopicMatrix, j)];
    result[`${topicTitle}`] = topicDocs;
  }
  return result;
};
