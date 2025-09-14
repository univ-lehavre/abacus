import type { IMatrix } from './types';
import { DenseMatrix } from './dense';
import { CSRMatrix } from './csr';

/**
 * Wrapper de matrice qui choisit automatiquement l’implémentation Dense ou CSR
 * en fonction de la densité des données. Délègue toutes les opérations à
 * l’implémentation sous-jacente et renvoie à nouveau un Matrix en sortie.
 */
export class Matrix implements IMatrix {
  /** Implémentation sous-jacente (DenseMatrix ou CSRMatrix). */
  private impl: IMatrix;
  /** Seuil de densité (0..1) en dessous duquel on privilégie CSR. */
  private readonly threshold: number;

  /** Nombre de lignes. */
  get rows(): number {
    return this.impl.rows;
  }
  /** Nombre de colonnes. */
  get cols(): number {
    return this.impl.cols;
  }

  /** Type d’implémentation courante. */
  get backend(): 'dense' | 'csr' {
    return this.impl instanceof CSRMatrix ? 'csr' : 'dense';
  }

  private constructor(impl: IMatrix, threshold: number) {
    this.impl = impl;
    this.threshold = threshold;
  }

  /**
   * Décide Dense vs CSR selon la densité (nnz / (rows*cols)).
   * @param rows Lignes
   * @param cols Colonnes
   * @param nnz Nombre d’éléments non nuls
   * @param threshold Seuil (par défaut 0.2)
   */
  static chooseBackend(rows: number, cols: number, nnz: number, threshold = 0.2): 'dense' | 'csr' {
    const size = rows * cols;
    const density = size > 0 ? nnz / size : 0;
    return density <= threshold ? 'csr' : 'dense';
  }

  /**
   * Construit une Matrix de zéros (choisira CSR par défaut).
   */
  static zeros(rows: number, cols: number, threshold = 0.2): Matrix {
    const impl = new CSRMatrix(
      rows,
      cols,
      new Float64Array(0),
      new Uint32Array(0),
      new Uint32Array([0]),
    );
    return new Matrix(impl, threshold);
  }

  /**
   * Construit une matrice identité (souvent CSR pour n ≥ 5 si threshold=0.2).
   */
  static identity(n: number, threshold = 0.2): Matrix {
    const entries: Array<{ i: number; j: number; v: number }> = [];
    for (let i = 0; i < n; i++) entries.push({ i, j: i, v: 1 });
    return Matrix.fromCOO(n, n, entries, threshold);
  }

  /**
   * Construit depuis un tableau 2D. Comptage des nnz pour choisir l’implémentation.
   */
  static from2D(values: number[][], threshold = 0.2): Matrix {
    const rows = values.length;
    const cols = rows > 0 ? values[0].length : 0;
    let nnz = 0;
    for (let i = 0; i < rows; i++) {
      if (values[i].length !== cols) throw new Error('Lignes de tailles différentes');
      for (let j = 0; j < cols; j++) if (values[i][j] !== 0) nnz++;
    }
    const choice = Matrix.chooseBackend(rows, cols, nnz, threshold);
    if (choice === 'dense') return new Matrix(DenseMatrix.from2D(values), threshold);
    // Construire directement une CSR via COO pour éviter stocker les zéros
    const entries: Array<{ i: number; j: number; v: number }> = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const v = values[i][j];
        if (v !== 0) entries.push({ i, j, v });
      }
    }
    return new Matrix(CSRMatrix.fromCOO(rows, cols, entries), threshold);
  }

  /**
   * Construit depuis des triplets COO et choisit automatiquement Dense vs CSR.
   */
  static fromCOO(
    rows: number,
    cols: number,
    entries: Array<{ i: number; j: number; v: number }>,
    threshold = 0.2,
  ): Matrix {
    const nnz = entries.length;
    const choice = Matrix.chooseBackend(rows, cols, nnz, threshold);
    if (choice === 'dense') {
      const A = new DenseMatrix(rows, cols);
      for (const { i, j, v } of entries) A.set(i, j, v);
      return new Matrix(A, threshold);
    }
    return new Matrix(CSRMatrix.fromCOO(rows, cols, entries), threshold);
  }

  /**
   * Enveloppe une implémentation existante sans re-décider le backend.
   */
  static wrap(impl: IMatrix, threshold = 0.2): Matrix {
    return new Matrix(impl, threshold);
  }

  get(i: number, j: number): number {
    return this.impl.get(i, j);
  }
  set(i: number, j: number, value: number): void {
    this.impl.set(i, j, value);
  }

  add(B: IMatrix): IMatrix {
    const rhs = B instanceof Matrix ? B.impl : B;
    const out = this.impl.add(rhs);
    return Matrix.wrap(out, this.threshold);
  }

  sub(B: IMatrix): IMatrix {
    const rhs = B instanceof Matrix ? B.impl : B;
    const out = this.impl.sub(rhs);
    return Matrix.wrap(out, this.threshold);
  }

  mul(B: number | IMatrix): IMatrix {
    if (typeof B === 'number') {
      return Matrix.wrap(this.impl.mul(B), this.threshold);
    }
    const rhs: IMatrix = B instanceof Matrix ? B.impl : B;
    const out = this.impl.mul(rhs);
    return Matrix.wrap(out, this.threshold);
  }

  transpose(): IMatrix {
    return Matrix.wrap(this.impl.transpose(), this.threshold);
  }

  matvec(x: Float64Array): Float64Array {
    return this.impl.matvec(x);
  }

  toDense(): IMatrix {
    return this.impl.toDense();
  }

  /**
   * Re-conditionne la matrice dans l’implémentation optimale au regard du threshold courant.
   * Utile après de nombreuses mises à jour via set().
   */
  repack(): void {
    // Estimer nnz en convertissant dense->compte et csr->nnz direct
    const rows = this.rows;
    const cols = this.cols;
    let nnz = 0;
    if (this.impl instanceof CSRMatrix) {
      nnz = this.impl.values.length;
    } else if (this.impl instanceof DenseMatrix) {
      const A = this.impl;
      const n = rows * cols;
      for (let k = 0; k < n; k++) if (A.data[k] !== 0) nnz++;
    } else {
      // Implémentation inconnue: fallback via toDense puis compter
      const D = this.impl.toDense() as DenseMatrix;
      const n = rows * cols;
      for (let k = 0; k < n; k++) if (D.data[k] !== 0) nnz++;
    }
    const backend = Matrix.chooseBackend(rows, cols, nnz, this.threshold);
    if (backend === 'csr' && !(this.impl instanceof CSRMatrix)) {
      this.impl = CSRMatrix.fromDense(this.impl.toDense() as DenseMatrix);
    }
    if (backend === 'dense' && !(this.impl instanceof DenseMatrix)) {
      this.impl = this.impl.toDense();
    }
  }
}
