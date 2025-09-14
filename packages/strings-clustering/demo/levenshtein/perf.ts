import os from 'os';
import { levenshtein } from '../../src/utils';

/**
 * Générateur de chaîne aléatoire composée de lettres minuscules.
 */
function randString(len: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * Injecte du bruit (insertions/suppressions/substitutions) dans une chaîne.
 * noise : proportion d'opérations par rapport à la longueur initiale (0..1)
 */
function addNoise(src: string, noise: number) {
  const ops = Math.max(0, Math.floor(src.length * noise));
  const arr = src.split('');
  for (let i = 0; i < ops; i++) {
    const op = Math.random();
    const pos = Math.floor(Math.random() * (arr.length + 1));
    if (op < 0.33) {
      // insertion
      arr.splice(pos, 0, String.fromCharCode(97 + Math.floor(Math.random() * 26)));
    } else if (op < 0.66 && arr.length > 0) {
      // deletion
      arr.splice(Math.max(0, pos - 1), 1);
    } else if (arr.length > 0) {
      // substitution
      const p = Math.max(0, Math.min(arr.length - 1, pos - 1));
      arr[p] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
  }
  return arr.join('');
}

export const run = async () => {
  const cpuInfo = os.cpus();
  const cpuModel = cpuInfo.length > 0 ? cpuInfo[0].model : 'unknown';
  const cpuCount = cpuInfo.length;

  // Paramètres — valeurs raisonnables pour un test de CI local
  const lengths = [50, 200];
  const noiseLevels = [0, 0.05, 0.2, 0.5];
  const pairsPerCase = 20; // réduit pour exécution rapide

  console.log('\n--- Performance Levenshtein — CPU info ---');
  console.log(`CPU : ${cpuModel}  cores: ${cpuCount}`);

  for (const len of lengths) {
    for (const noise of noiseLevels) {
      // Préparer paires
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < pairsPerCase; i++) {
        const a = randString(len);
        const b = addNoise(a, noise);
        pairs.push([a, b]);
      }

      const memBefore = process.memoryUsage();
      const t0 = process.hrtime.bigint();

      for (const [a, b] of pairs) {
        void levenshtein(a, b);
      }

      const t1 = process.hrtime.bigint();
      const memAfter = process.memoryUsage();

      const durationMs = Number(t1 - t0) / 1_000_000;
      const avgMs = durationMs / pairsPerCase;
      const rssDelta = memAfter.rss - memBefore.rss;
      const heapUsedDelta = memAfter.heapUsed - memBefore.heapUsed;

      console.log(`len=${len} noise=${(noise * 100).toFixed(1)}%  calls=${pairsPerCase}`);
      console.log(`  total ${durationMs.toFixed(2)} ms — avg ${avgMs.toFixed(4)} ms/call`);
      console.log(`  mem delta: rss ${rssDelta} bytes, heapUsed ${heapUsedDelta} bytes`);
    }
  }
};
