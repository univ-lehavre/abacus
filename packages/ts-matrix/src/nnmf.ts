import { DenseMatrix } from './dense-matrix';
import { dot, eldiv, transpose } from './utils';

export const clampNonNeg = (arr: number[]) => arr.map(v => Math.max(0, v));

export const reconstructionError = (WH: number[], V: number[]) =>
  Math.sqrt(WH.reduce((acc, v, i) => acc + (v - V[i]) ** 2, 0));

export const updateH = (
  W: number[],
  H: number[],
  V: number[],
  m: number,
  rank: number,
  n: number,
): number[] => {
  const Wt = transpose(W, m, rank);
  const WH = dot(W, m, rank, H, n);
  const numH = dot(Wt, rank, m, V, n);
  const denH = dot(Wt, rank, m, WH, n);
  const newH = eldiv(H, denH).map((h, i) => h * numH[i]);
  return clampNonNeg(newH);
};

export const updateW = (
  W: number[],
  H: number[],
  V: number[],
  m: number,
  rank: number,
  n: number,
): number[] => {
  const WH = dot(W, m, rank, H, n);
  const Ht = transpose(H, rank, n);
  const numW = dot(V, m, n, Ht, rank);
  const denW = dot(WH, m, n, Ht, rank);
  const newW = eldiv(W, denW).map((w, i) => w * numW[i]);
  return clampNonNeg(newW);
};

export const initMatrices = (m: number, n: number, rank: number): { W: number[]; H: number[] } => {
  const W = Array.from({ length: m * rank }, () => Math.random());
  const H = Array.from({ length: rank * n }, () => Math.random());
  return { W, H };
};

export const hasConverged = (prevError: number, error: number, tol: number): boolean => {
  return Math.abs(prevError - error) < tol;
};

export const runNNMF = (
  denseMatrix: DenseMatrix,
  rank: number,
  maxIter: number,
  tol: number,
): { W: DenseMatrix; H: DenseMatrix } => {
  const { nRows, nCols } = denseMatrix;
  let { W, H } = initMatrices(nRows, nCols, rank);
  const data = denseMatrix.getData();
  let prevError = Infinity;
  for (let iter = 0; iter < maxIter; iter++) {
    H = updateH(W, H, data, nRows, rank, nCols);
    W = updateW(W, H, data, nRows, rank, nCols);
    const WHnew = dot(W, nRows, rank, H, nCols);
    const error = reconstructionError(WHnew, data);
    if (hasConverged(prevError, error, tol)) break;
    prevError = error;
  }
  return {
    W: new DenseMatrix(W, { ncol: rank, nonNegative: true }),
    H: new DenseMatrix(H, { ncol: nCols, nonNegative: true }),
  };
};

export type NnmfResult = [DenseMatrix, DenseMatrix];

export interface NnmfOptions {
  maxIter?: number;
  tol?: number;
}

export const nnmf = (
  data: DenseMatrix,
  rank: number,
  opts: NnmfOptions = {
    maxIter: 10000,
    tol: 1e-12,
  },
): NnmfResult => {
  if (!opts.maxIter || typeof opts.maxIter !== 'number' || opts.maxIter <= 0)
    throw new Error('maxIter must be a positive integer');
  if (!opts.tol || typeof opts.tol !== 'number' || opts.tol <= 0)
    throw new Error('tol must be a positive number');
  if (rank <= 0 || rank > data.nCols)
    throw new Error('rank must be a positive integer less than or equal to nCols');
  const { W, H } = runNNMF(data, rank, opts.maxIter, opts.tol);
  return [W, H];
};
