import { CSRMatrix } from '../src/csr';

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomCSR(rows: number, cols: number, density: number): CSRMatrix {
  const entries: Array<{ i: number; j: number; v: number }> = [];
  const target = Math.floor(rows * cols * density);
  const used = new Set<string>();
  while (entries.length < target) {
    const i = randInt(rows);
    const j = randInt(cols);
    const key = `${i}:${j}`;
    if (used.has(key)) continue;
    used.add(key);
    const v = Math.random() * 2 - 1;
    if (v !== 0) entries.push({ i, j, v });
  }
  return CSRMatrix.fromCOO(rows, cols, entries);
}

function timeit(fn: () => void, repeat = 1): number {
  const t0 = performance.now();
  for (let r = 0; r < repeat; r++) fn();
  const t1 = performance.now();
  return (t1 - t0) / repeat;
}

function benchSizes() {
  const sizes = [
    { m: 50, k: 50, n: 50 },
    { m: 100, k: 100, n: 100 },
    { m: 200, k: 200, n: 200 },
  ];
  console.log('=== Bench par taille (densité 5%) ===');
  for (const { m, k, n } of sizes) {
    const A = randomCSR(m, k, 0.05);
    const B = randomCSR(k, n, 0.05);
    const denseA = A.toDense();
    const denseB = B.toDense();
    const tCsr = timeit(() => {
      const C = A.mul(B);
      void C;
    }, 3);
    const tDense = timeit(() => {
      const C = denseA.mul(denseB);
      void C;
    }, 3);
    console.log(
      `m=${m},k=${k},n=${n} -> CSRxCSR: ${tCsr.toFixed(2)} ms, DensexDense: ${tDense.toFixed(2)} ms`,
    );
  }
}

function benchDensities() {
  const m = 150,
    k = 150,
    n = 150;
  const densities = [0.01, 0.03, 0.05, 0.1, 0.2];
  console.log('=== Bench par densité (taille 150) ===');
  for (const d of densities) {
    const A = randomCSR(m, k, d);
    const B = randomCSR(k, n, d);
    const tCsr = timeit(() => {
      const C = A.mul(B);
      void C;
    }, 3);
    console.log(`density=${(d * 100).toFixed(1)}% -> CSRxCSR: ${tCsr.toFixed(2)} ms`);
  }
}

function main() {
  benchSizes();
  benchDensities();
}

main();
