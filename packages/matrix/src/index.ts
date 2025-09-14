import { DenseMatrix } from './dense';
export { DenseMatrix } from './dense';
export { CSRMatrix } from './csr';
export type { IMatrix, Shape } from './types';

// Helpers
/**
 * Crée une DenseMatrix de zéros (rows × cols).
 */
export const zeros = (rows: number, cols: number) => new DenseMatrix(rows, cols);
/**
 * Crée une matrice identité Dense n × n.
 */
export const identity = (n: number) => DenseMatrix.identity(n);
/**
 * Construit une DenseMatrix à partir d’un tableau 2D JavaScript.
 */
export const from2D = (values: number[][]) => DenseMatrix.from2D(values);
