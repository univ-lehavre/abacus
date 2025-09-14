import { DenseMatrix } from './dense';
export { DenseMatrix } from './dense';
export { CSRMatrix } from './csr';
export type { IMatrix, Shape } from './types';

// Helpers
export const zeros = (rows: number, cols: number) => new DenseMatrix(rows, cols);
export const identity = (n: number) => DenseMatrix.identity(n);
export const from2D = (values: number[][]) => DenseMatrix.from2D(values);
