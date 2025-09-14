#!/usr/bin/env -S tsx

import { levenshtein } from '../../src/utils';
import { run } from './perf';

function showPair(title: string, a: string, b: string) {
  const d = levenshtein(a, b);
  console.log(`${title}\n  '${a}' ↔ '${b}'  => distance = ${d}\n`);
}

console.log('=== Levenshtein ===\n');

// 1) AJOUT (Insertion)
console.log('--- 1) Ajout (insertion) ---');
// Exemple simple : ajouter un caractère
showPair('Insertion simple', 'cat', 'cart'); // ajouter 'r' => distance 1
// Ajout multiple
showPair('Insertion multiple', 'abc', '__abc__'); // padding équivaut à plusieurs insertions

// 2) SUPPRESSION (Deletion)
console.log('--- 2) Suppression (deletion) ---');
showPair('Suppression simple', 'house', 'hous'); // suppression de 'e' => distance 1
showPair('Suppression totale partielle', 'abcdef', 'abcf'); // suppression de deux caractères

// 3) MODIFICATION (Substitution)
console.log('--- 3) Modification (substitution) ---');
showPair('Substitution simple', 'cat', 'cut'); // 'a' -> 'u'
showPair('Substitution multiple', 'flaw', 'lawn'); // plusieurs substitutions/permutes légères

// 4) CAS MIXTES (combinaison d'opérations)
console.log("--- 4) Mélange : séquences d'opérations ---");

// Exemple classique : kitten -> sitting (substitutions + insertions)
const steps1 = ['kitten', 'sitten', 'sittin', 'sitting'];
console.log('Exemple pas-à-pas: kitten -> sitting');
for (let i = 0; i < steps1.length - 1; i++) {
  const a = steps1[i];
  const b = steps1[i + 1];
  console.log(`  ${a} -> ${b}  : distance = ${levenshtein(a, b)}`);
}
console.log(`  Total: ${levenshtein(steps1[0], steps1[steps1.length - 1])}\n`);

// Exemple plus long et illustratif: intention -> execution
showPair('Cas mixte complexe', 'intention', 'execution');

run();

console.log('\n--- Fin de la démo ---');
