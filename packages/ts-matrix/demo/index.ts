import { nnmf, DenseMatrix } from '../src/index.js';
import { dot } from '../src/utils.js';

const arrondirMatrice = (mat: number[][], digits = 1): string[][] => {
  return mat.map(row => row.map(v => v.toFixed(digits)));
};

const reconstruct = (W: DenseMatrix, H: DenseMatrix) => {
  const w = W.getData();
  const h = H.getData();
  const m = W.nRows;
  const r = W.nCols;
  const n = H.nCols;
  return dot(w, m, r, h, n);
};

const run = (data: DenseMatrix, rank: number) => {
  const [W, H] = nnmf(data, rank, 10000, 1e-12);

  console.log('Matrice originale (5x5):');
  for (let i = 0; i < data.nRows; i++) {
    console.log(
      data
        .getData()
        .slice(i * data.nCols, (i + 1) * data.nCols)
        .map(v => v.toFixed(1)),
    );
  }

  console.log('\nW:', arrondirMatrice(W.toDense()));
  console.log('H:', arrondirMatrice(H.toDense()));

  console.log('\nReconstruction (5x5):');
  const recon = reconstruct(W, H);
  for (let i = 0; i < data.nRows; i++) {
    const ligne = recon.slice(i * data.nCols, (i + 1) * data.nCols).map(v => v.toFixed(1));
    console.log(ligne);
  }
};

// prettier-ignore
const matrix = new DenseMatrix([
	1, 1, 0, 0, 0, // motif 1
	1, 1, 0, 0, 0, // motif 2
	0, 0, 1, 1, 0, // motif 3
	0, 0, 1, 1, 0, // motif 4
	1, 0, 0, 0, 0, // motif 5
], { ncol: 5, nonNegative: true });
run(matrix, 3);
