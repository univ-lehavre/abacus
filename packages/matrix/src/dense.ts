import type { IMatrix } from './types';

/**
 * DenseMatrix: stockage row-major via Float64Array
 */
export class DenseMatrix implements IMatrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: Float64Array;

  constructor(rows: number, cols: number, data?: Float64Array) {
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 0 || cols < 0) {
      throw new Error('Dimensions invalides');
    }
    this.rows = rows;
    this.cols = cols;
    if (data) {
      if (data.length !== rows * cols) throw new Error('Taille de données incompatible');
      this.data = data;
    } else {
      this.data = new Float64Array(rows * cols);
    }
  }

  static zeros(rows: number, cols: number): DenseMatrix {
    return new DenseMatrix(rows, cols);
  }

  static identity(n: number): DenseMatrix {
    const A = new DenseMatrix(n, n);
    for (let i = 0; i < n; i++) A.data[i * n + i] = 1;
    return A;
  }

  static from2D(values: number[][]): DenseMatrix {
    const rows = values.length;
    const cols = rows > 0 ? values[0].length : 0;
    const A = new DenseMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
      if (values[i].length !== cols) throw new Error('Lignes de tailles différentes');
      for (let j = 0; j < cols; j++) A.data[i * cols + j] = values[i][j] ?? 0;
    }
    return A;
  }

  private idx(i: number, j: number): number {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols)
      throw new RangeError('Indice hors limites');
    return i * this.cols + j;
  }

  get(i: number, j: number): number {
    return this.data[this.idx(i, j)];
  }

  set(i: number, j: number, value: number): void {
    this.data[this.idx(i, j)] = value;
  }

  add(B: IMatrix): IMatrix {
    if (this.rows !== B.rows || this.cols !== B.cols)
      throw new Error('Dimensions incompatibles pour add');
    // Optimisé si B est Dense
    if (B instanceof DenseMatrix) {
      const out = new DenseMatrix(this.rows, this.cols);
      const n = this.data.length;
      for (let k = 0; k < n; k++) out.data[k] = this.data[k] + B.data[k];
      return out;
    }
    // fallback: conversion
    const Bd = B.toDense();
    return this.add(Bd);
  }

  sub(B: IMatrix): IMatrix {
    if (this.rows !== B.rows || this.cols !== B.cols)
      throw new Error('Dimensions incompatibles pour sub');
    if (B instanceof DenseMatrix) {
      const out = new DenseMatrix(this.rows, this.cols);
      const n = this.data.length;
      for (let k = 0; k < n; k++) out.data[k] = this.data[k] - B.data[k];
      return out;
    }
    const Bd = B.toDense();
    return this.sub(Bd);
  }

  mul(B: number | IMatrix): IMatrix {
    if (typeof B === 'number') {
      const out = new DenseMatrix(this.rows, this.cols);
      const n = this.data.length;
      for (let k = 0; k < n; k++) out.data[k] = this.data[k] * B;
      return out;
    }
    // Matmul
    if (this.cols !== B.rows) throw new Error('Dimensions incompatibles pour mul');
    const C = new DenseMatrix(this.rows, B.cols);

    // Optimiser si B est Dense aussi
    if (B instanceof DenseMatrix) {
      const Ar = this.rows,
        Ac = this.cols,
        Bc = B.cols;
      const Ad = this.data,
        Bd = B.data,
        Cd = C.data;
      for (let i = 0; i < Ar; i++) {
        const arow = i * Ac;
        for (let k = 0; k < Ac; k++) {
          const aik = Ad[arow + k];
          if (aik === 0) continue;
          const brow = k * Bc;
          for (let j = 0; j < Bc; j++) {
            Cd[i * Bc + j] += aik * Bd[brow + j];
          }
        }
      }
      return C;
    }
    // sinon convertir B
    return this.mul(B.toDense());
  }

  transpose(): IMatrix {
    const out = new DenseMatrix(this.cols, this.rows);
    const R = this.rows,
      C = this.cols;
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) out.data[j * R + i] = this.data[i * C + j];
    }
    return out;
  }

  matvec(x: Float64Array): Float64Array {
    if (x.length !== this.cols) throw new Error('Taille du vecteur incompatible');
    const y = new Float64Array(this.rows);
    const R = this.rows,
      C = this.cols;
    for (let i = 0; i < R; i++) {
      let sum = 0;
      const row = i * C;
      for (let k = 0; k < C; k++) sum += this.data[row + k] * x[k];
      y[i] = sum;
    }
    return y;
  }

  toDense(): DenseMatrix {
    // Retourne une copie pour éviter des surprises d’aliasing
    return new DenseMatrix(this.rows, this.cols, this.data.slice());
  }
}
