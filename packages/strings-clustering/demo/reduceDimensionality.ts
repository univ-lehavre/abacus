import {
  tfCorpus,
  vocabulary,
  tfidfCorpus,
  tokensCorpus,
  softmaxTfidf,
  sparseToDense,
  reduceDimensionality,
} from '../src/embeddings';

const nbrTopics = 3;
const opts = { minN: 2, maxN: 8 };

// Exemple de corpus de textes
// Groupe 1 : animaux / animaux domestiques / oiseaux
// 3 groupes de 2 documents chacun avec des similarités marqués par groupe
const corpus: string[] = [
  'Le chat est un animal domestique.',
  'Le chien est un animal domestique.',
  'Le lion est un animal sauvage.',
  'Le tigre est un animal sauvage.',
  'Le perroquet est un oiseau coloré.',
  "L'aigle est un oiseau majestueux.",
];

console.log('Corpus :', corpus);
// Calcul des tokens, TF, vocabulaire et TF-IDF
const tokens = tokensCorpus(corpus, opts);
console.log('Tokens :', tokens);
const tf = tfCorpus(tokens);
// Affiche le TF Corpus en ordonnant les 10 meilleurs tokens par document
console.log(
  'TF Corpus :',
  tf.map(doc => {
    const sorted = Array.from(doc.entries()).sort((a, b) => b[1] - a[1]);
    return new Map(sorted.slice(0, 10));
  }),
);
const vocab = vocabulary(tf);
console.log('Vocabulaire :', vocab);
const tfidf = tfidfCorpus(tf, vocab);
// Affiche le TFIDF Corpus en ordonnant les 10 meilleurs tokens par document
console.log(
  'TF-IDF Corpus :',
  tfidf.map(doc => {
    const sorted = Array.from(doc.entries()).sort((a, b) => b[1] - a[1]);
    return new Map(sorted.slice(0, 10));
  }),
);
const softmax = softmaxTfidf(tfidf);
// Affiche le softmax Corpus en ordonnant les 10 meilleurs tokens par document
console.log(
  'Softmax TF-IDF Corpus :',
  softmax.map(doc => {
    const sorted = Array.from(doc.entries()).sort((a, b) => b[1] - a[1]);
    return new Map(sorted.slice(0, 10));
  }),
);
const dense = sparseToDense(softmax, vocab);
console.log(`Vocabulaire taille : ${vocab.length}`);
console.log(`Matrice dense (${dense.length} x ${dense[0].length}) :`);
// Réduction de dimensionnalité avec 4 topics
const { docTopicMatrix, topicTokenMatrix } = reduceDimensionality(corpus, nbrTopics, opts);

// Connaissant docTopicMatrix et vocab, affiche les topics par document
for (let i = 0; i < docTopicMatrix.getData().length; i += nbrTopics) {
  const docTopics = docTopicMatrix.getData().slice(i, i + nbrTopics);
  // rappelle le document et arrondit les scores à 1 décimales
  console.log(
    `Document ${corpus[i / nbrTopics]} :`,
    docTopics.map(score => score.toFixed(1)),
  );
}

// Connaissant topicTokenMatrix et vocab, affiche les 4 meilleurs termes par topic
let topic = 0;
for (let i = 0; i < topicTokenMatrix.getData().length; i += vocab.length) {
  topic++;
  const topicTokens = topicTokenMatrix.getData().slice(i, i + vocab.length);
  const topTerms = Array.from(topicTokens.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(
    `Topic ${topic} :`,
    topTerms.map(([term, score]) => `${vocab[term]} (${score.toFixed(3)})`),
  );
}
