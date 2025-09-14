import type { IMatrix } from './types';

/**
 * Matrice dense en ordre row-major, stockée dans un `Float64Array` contigu.
 *
 * - L’élément A[i,j] est stocké à l’index `i * cols + j`.
 * - Opérations optimisées: addition/soustraction élémentaires, produit scalaire,
 *   produit matriciel Dense×Dense, transposition, produit matrice-vecteur.
 */
export class DenseMatrix implements IMatrix {
  /** Nombre de lignes. */
  readonly rows: number;
  /** Nombre de colonnes. */
  readonly cols: number;
  /** Données en row-major, longueur rows*cols. */
  readonly data: Float64Array;

  /**
   * Construit une matrice dense.
   * @param rows Nombre de lignes (entier ≥ 0)
   * @param cols Nombre de colonnes (entier ≥ 0)
   * @param data Optionnel: tampon `Float64Array` existant de longueur `rows*cols`
   * @throws {Error} Si `rows`/`cols` sont invalides ou si `data` a une longueur incompatible
   */
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

  /**
   * Crée une matrice dense remplie de zéros.
   * @param rows Nombre de lignes
   * @param cols Nombre de colonnes
   */
  static zeros(rows: number, cols: number): DenseMatrix {
    return new DenseMatrix(rows, cols);
  }

  /**
   * Crée la matrice identité de taille n.
   * @param n Taille (n×n)
   */
  static identity(n: number): DenseMatrix {
    const A = new DenseMatrix(n, n);
    for (let i = 0; i < n; i++) A.data[i * n + i] = 1;
    return A;
  }

  /**
   * Construit une DenseMatrix depuis un tableau 2D JS.
   * @param values Tableau de `rows` lignes, chacune de `cols` colonnes (rectangulaire)
   * @throws {Error} Si les lignes n’ont pas la même longueur
   */
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

  /**
   * Calcule l’index linéaire dans `data` pour (i,j), avec vérification de bornes.
   * @param i Ligne (0 ≤ i < rows)
   * @param j Colonne (0 ≤ j < cols)
   * @throws {RangeError} Si hors bornes
   */
  private idx(i: number, j: number): number {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols)
      throw new RangeError('Indice hors limites');
    return i * this.cols + j;
  }

  /**
   * Retourne la valeur A[i,j].
   * @param i Ligne
   * @param j Colonne
   */
  get(i: number, j: number): number {
    return this.data[this.idx(i, j)];
  }

  /**
   * Affecte la valeur A[i,j].
   * @param i Ligne
   * @param j Colonne
   * @param value Nouvelle valeur
   */
  set(i: number, j: number, value: number): void {
    this.data[this.idx(i, j)] = value;
  }

  /**
   * Addition matricielle A + B.
   * @param B Matrice de même dimension
   * @returns DenseMatrix si B est Dense, sinon convertit B en Dense
   * @throws {Error} Si les dimensions sont incompatibles
   */
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

  /**
   * Soustraction matricielle A - B.
   * @param B Matrice de même dimension
   * @returns DenseMatrix si B est Dense, sinon convertit B en Dense
   * @throws {Error} Si les dimensions sont incompatibles
   */
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

  /**
   * Multiplication par scalaire ou produit matriciel.
   * @param B Scalaire ou matrice à multiplier
   * @returns DenseMatrix
   * @throws {Error} Si les dimensions sont incompatibles pour un produit matriciel
   */
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

  /**
   * Transposée de la matrice (Dense -> Dense).
   */
  transpose(): IMatrix {
    const out = new DenseMatrix(this.cols, this.rows);
    const R = this.rows,
      C = this.cols;
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) out.data[j * R + i] = this.data[i * C + j];
    }
    return out;
  }

  /**
   * Produit matrice-vecteur y = A x.
   * @param x Vecteur de taille `cols`
   * @returns y de taille `rows`
   * @throws {Error} Si la taille de x est incompatible
   */
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

  /**
   * Retourne une copie dense (séparée) de la matrice.
   */
  toDense(): DenseMatrix {
    // Retourne une copie pour éviter des surprises d’aliasing
    return new DenseMatrix(this.rows, this.cols, this.data.slice());
  }
}
