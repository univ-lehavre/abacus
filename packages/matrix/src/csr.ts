import type { IMatrix } from './types';
import { DenseMatrix } from './dense';

/**
 * CSRMatrix: Compressed Sparse Row
 * - values: non-zero values
 * - colIndex: column indices pour chaque valeur
 * - rowPtr: taille rows+1, pointeurs de début de ligne dans values/colIndex
 */
export class CSRMatrix implements IMatrix {
  readonly rows: number;
  readonly cols: number;
  values: Float64Array;
  colIndex: Uint32Array;
  rowPtr: Uint32Array;

  constructor(
    rows: number,
    cols: number,
    values: Float64Array,
    colIndex: Uint32Array,
    rowPtr: Uint32Array,
  ) {
    if (rowPtr.length !== rows + 1) throw new Error('rowPtr invalide');
    if (values.length !== colIndex.length) throw new Error('values/colIndex longueur différente');
    if (rowPtr[0] !== 0 || rowPtr[rowPtr.length - 1] !== values.length)
      throw new Error('rowPtr non cohérent');
    this.rows = rows;
    this.cols = cols;
    this.values = values;
    this.colIndex = colIndex;
    this.rowPtr = rowPtr;
  }

  static fromCOO(
    rows: number,
    cols: number,
    entries: Array<{ i: number; j: number; v: number }>,
  ): CSRMatrix {
    // Trier par (i, j)
    entries.sort((a, b) => a.i - b.i || a.j - b.j);
    const rowPtr = new Uint32Array(rows + 1);
    for (const e of entries) {
      if (e.i < 0 || e.i >= rows || e.j < 0 || e.j >= cols)
        throw new RangeError('Indice hors limites');
      rowPtr[e.i + 1]++;
    }
    for (let r = 0; r < rows; r++) rowPtr[r + 1] += rowPtr[r];
    const nnz = rowPtr[rows];
    const values = new Float64Array(nnz);
    const colIndex = new Uint32Array(nnz);
    const cursor = rowPtr.slice();
    for (const { i, j, v } of entries) {
      const k = cursor[i]++;
      values[k] = v;
      colIndex[k] = j;
    }
    return new CSRMatrix(rows, cols, values, colIndex, rowPtr);
  }

  static fromDense(A: DenseMatrix): CSRMatrix {
    const rows = A.rows,
      cols = A.cols;
    const triplets: Array<{ i: number; j: number; v: number }> = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const v = A.get(i, j);
        if (v !== 0) triplets.push({ i, j, v });
      }
    }
    return CSRMatrix.fromCOO(rows, cols, triplets);
  }

  get(i: number, j: number): number {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols)
      throw new RangeError('Indice hors limites');
    const start = this.rowPtr[i];
    const end = this.rowPtr[i + 1];
    for (let k = start; k < end; k++) {
      if (this.colIndex[k] === j) return this.values[k];
      if (this.colIndex[k] > j) break; // CSR trié par j
    }
    return 0;
  }

  set(i: number, j: number, value: number): void {
    // Opération coûteuse; ici version simple (reconstruction locale)
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols)
      throw new RangeError('Indice hors limites');
    const entries: Array<{ i: number; j: number; v: number }> = [];
    for (let r = 0; r < this.rows; r++) {
      const s = this.rowPtr[r];
      const e = this.rowPtr[r + 1];
      for (let k = s; k < e; k++) entries.push({ i: r, j: this.colIndex[k], v: this.values[k] });
    }
    // Mettre à jour/insérer
    let replaced = false;
    for (const t of entries) {
      if (t.i === i && t.j === j) {
        t.v = value;
        replaced = true;
        break;
      }
    }
    if (!replaced) entries.push({ i, j, v: value });
    const rebuilt = CSRMatrix.fromCOO(
      this.rows,
      this.cols,
      entries.filter(t => t.v !== 0),
    );
    this.values = rebuilt.values;
    this.colIndex = rebuilt.colIndex;
    this.rowPtr = rebuilt.rowPtr;
  }

  add(B: IMatrix): IMatrix {
    if (this.rows !== B.rows || this.cols !== B.cols)
      throw new Error('Dimensions incompatibles pour add');
    if (B instanceof CSRMatrix) {
      // CSR + CSR -> CSR
      const entries: Array<{ i: number; j: number; v: number }> = [];
      for (let i = 0; i < this.rows; i++) {
        let a = this.rowPtr[i];
        const aEnd = this.rowPtr[i + 1];
        let b = B.rowPtr[i];
        const bEnd = B.rowPtr[i + 1];
        while (a < aEnd || b < bEnd) {
          if (b >= bEnd || (a < aEnd && this.colIndex[a] < B.colIndex[b])) {
            entries.push({ i, j: this.colIndex[a], v: this.values[a] });
            a++;
          } else if (a >= aEnd || (b < bEnd && B.colIndex[b] < this.colIndex[a])) {
            entries.push({ i, j: B.colIndex[b], v: B.values[b] });
            b++;
          } else {
            const j = this.colIndex[a];
            const v = this.values[a] + B.values[b];
            if (v !== 0) entries.push({ i, j, v });
            a++;
            b++;
          }
        }
      }
      return CSRMatrix.fromCOO(this.rows, this.cols, entries);
    }
    // fallback: vers dense
    return this.toDense().add(B);
  }

  sub(B: IMatrix): IMatrix {
    if (this.rows !== B.rows || this.cols !== B.cols)
      throw new Error('Dimensions incompatibles pour sub');
    if (B instanceof CSRMatrix) {
      const entries: Array<{ i: number; j: number; v: number }> = [];
      for (let i = 0; i < this.rows; i++) {
        let a = this.rowPtr[i];
        const aEnd = this.rowPtr[i + 1];
        let b = B.rowPtr[i];
        const bEnd = B.rowPtr[i + 1];
        while (a < aEnd || b < bEnd) {
          if (b >= bEnd || (a < aEnd && this.colIndex[a] < B.colIndex[b])) {
            entries.push({ i, j: this.colIndex[a], v: this.values[a] });
            a++;
          } else if (a >= aEnd || (b < bEnd && B.colIndex[b] < this.colIndex[a])) {
            entries.push({ i, j: B.colIndex[b], v: -B.values[b] });
            b++;
          } else {
            const j = this.colIndex[a];
            const v = this.values[a] - B.values[b];
            if (v !== 0) entries.push({ i, j, v });
            a++;
            b++;
          }
        }
      }
      return CSRMatrix.fromCOO(this.rows, this.cols, entries);
    }
    return this.toDense().sub(B);
  }

  mul(B: number | IMatrix): IMatrix {
    if (typeof B === 'number') {
      const scaled = new Float64Array(this.values.length);
      for (let k = 0; k < this.values.length; k++) scaled[k] = this.values[k] * B;
      return new CSRMatrix(
        this.rows,
        this.cols,
        scaled,
        this.colIndex.slice(),
        this.rowPtr.slice(),
      );
    }
    // matmul
    if (this.cols !== B.rows) throw new Error('Dimensions incompatibles pour mul');
    // CSR * Dense plus efficace que conversion préalable
    if (B instanceof DenseMatrix) {
      const C = new DenseMatrix(this.rows, B.cols);
      const Cd = C.data;
      const Bc = B.cols;
      for (let i = 0; i < this.rows; i++) {
        const start = this.rowPtr[i],
          end = this.rowPtr[i + 1];
        for (let k = start; k < end; k++) {
          const j = this.colIndex[k];
          const a = this.values[k];
          const brow = j * Bc;
          const crow = i * Bc;
          for (let c = 0; c < Bc; c++) Cd[crow + c] += a * B.data[brow + c];
        }
      }
      return C;
    }
    if (B instanceof CSRMatrix) {
      // CSR * CSR -> CSR (algorithme de Gustavson par ligne)
      const rows = this.rows;
      const cols = B.cols;
      const outRowPtr = new Uint32Array(rows + 1);
      const outValues: number[] = [];
      const outColIndex: number[] = [];

      for (let i = 0; i < rows; i++) {
        const acc = new Map<number, number>();
        const aStart = this.rowPtr[i];
        const aEnd = this.rowPtr[i + 1];
        for (let kk = aStart; kk < aEnd; kk++) {
          const k = this.colIndex[kk]; // colonne de A (donc ligne de B)
          const a = this.values[kk];
          if (a === 0) continue;
          const bStart = B.rowPtr[k];
          const bEnd = B.rowPtr[k + 1];
          for (let t = bStart; t < bEnd; t++) {
            const j = B.colIndex[t];
            const prod = a * B.values[t];
            if (prod === 0) continue;
            const prev = acc.get(j) ?? 0;
            const sum = prev + prod;
            if (sum !== 0) acc.set(j, sum);
            else acc.delete(j); // élaguer les zéros exacts
          }
        }

        // Ranger par colonne croissante pour respecter l'invariant CSR
        const js = Array.from(acc.keys()).sort((x, y) => x - y);
        for (const j of js) {
          outColIndex.push(j);
          outValues.push(acc.get(j)!);
        }
        outRowPtr[i + 1] = outRowPtr[i] + js.length;
      }

      const values = new Float64Array(outValues);
      const colIndex = new Uint32Array(outColIndex);
      return new CSRMatrix(rows, cols, values, colIndex, outRowPtr);
    }
    return this.mul(B.toDense());
  }

  transpose(): IMatrix {
    // Transposition via COO puis reconstruction
    const entries: Array<{ i: number; j: number; v: number }> = [];
    for (let i = 0; i < this.rows; i++) {
      const s = this.rowPtr[i],
        e = this.rowPtr[i + 1];
      for (let k = s; k < e; k++) entries.push({ i: this.colIndex[k], j: i, v: this.values[k] });
    }
    return CSRMatrix.fromCOO(this.cols, this.rows, entries);
  }

  matvec(x: Float64Array): Float64Array {
    if (x.length !== this.cols) throw new Error('Taille du vecteur incompatible');
    const y = new Float64Array(this.rows);
    for (let i = 0; i < this.rows; i++) {
      let sum = 0;
      const start = this.rowPtr[i],
        end = this.rowPtr[i + 1];
      for (let k = start; k < end; k++) sum += this.values[k] * x[this.colIndex[k]];
      y[i] = sum;
    }
    return y;
  }

  toDense(): DenseMatrix {
    const A = new DenseMatrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      const s = this.rowPtr[i],
        e = this.rowPtr[i + 1];
      for (let k = s; k < e; k++) A.set(i, this.colIndex[k], this.values[k]);
    }
    return A;
  }
}
