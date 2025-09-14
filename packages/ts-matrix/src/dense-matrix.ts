export class DenseMatrix {
  private nrow: number;
  private ncol: number;
  private data: number[];
  private isNonNegative: boolean;

  constructor(
    data: number[] | number[][],
    opts: { ncol?: number; nonNegative: boolean } = { nonNegative: false },
  ) {
    this.isNonNegative = opts.nonNegative;

    if (DenseMatrix.is2D(data)) {
      const { flatData, nrow, ncol } = DenseMatrix.toFlat(data as number[][]);
      this.data = flatData;
      this.nrow = nrow;
      this.ncol = ncol;
    } else if (opts.ncol) {
      this.data = data as number[];
      this.ncol = opts.ncol;
      this.nrow = data.length / this.ncol;
    } else {
      throw new Error('ncol must be provided to create a DenseMatrix from flat data');
    }

    // Vérifie que ncol est un diviseur de la longueur de data
    if (this.ncol > this.data.length || this.data.length % this.ncol !== 0)
      throw new Error('Data length is not a multiple of ncol');

    // vérifie que nrow est un diviseur de la longueur de data
    if (this.nrow > this.data.length || this.data.length % this.nrow !== 0)
      throw new Error('Data length is not a multiple of nrow');

    // vérifie que nrow * ncol == data.length
    if (this.nrow * this.ncol !== this.data.length)
      throw new Error('nrow * ncol must equal data length');

    // Vérifie que data contient uniquement des nombres finis
    for (const v of this.data)
      if (typeof v !== 'number' || isNaN(v) || !isFinite(v))
        throw new Error('Data must contain only finite numbers');

    // vérifie que data contient uniquement des nombres positifs
    if (opts.nonNegative)
      for (const v of this.data)
        if (v < 0) throw new Error('Data must contain only non-negative finite numbers');

    this.isNonNegative = true;
  }

  get nRows(): number {
    return this.nrow;
  }

  get nCols(): number {
    return this.ncol;
  }

  static is2D(data: number[] | number[][]): boolean {
    return Array.isArray(data) && data.every(Array.isArray);
  }

  static toFlat(data: number[][]): { flatData: number[]; nrow: number; ncol: number } {
    const flatData = data.flat();
    const nrow = data.length;
    const ncol = flatData.length / nrow;
    return { flatData, nrow, ncol };
  }

  toDense(): number[][] {
    const out: number[][] = [];
    for (let i = 0; i < this.nrow; i++) {
      out.push(this.data.slice(i * this.ncol, (i + 1) * this.ncol));
    }
    return out;
  }

  to2D(): number[][] {
    const out: number[][] = [];
    for (let i = 0; i < this.data.length; i += this.ncol) {
      out.push(this.data.slice(i, i + this.ncol));
    }
    return out;
  }

  getCol(colIndex: number): number[] {
    if (colIndex < 0 || colIndex >= this.ncol) throw new Error('colIndex out of bounds');
    const col: number[] = [];
    for (let i = 0; i < this.nrow; i++) {
      col.push(this.data[i * this.ncol + colIndex]);
    }
    return col;
  }

  getRow(rowIndex: number): number[] {
    if (rowIndex < 0 || rowIndex >= this.nrow) throw new Error('rowIndex out of bounds');
    return this.data.slice(rowIndex * this.ncol, (rowIndex + 1) * this.ncol);
  }

  getCell(rowIndex: number, colIndex: number): number {
    if (rowIndex < 0 || rowIndex >= this.nrow) throw new Error('rowIndex out of bounds');
    if (colIndex < 0 || colIndex >= this.ncol) throw new Error('colIndex out of bounds');
    return this.data[rowIndex * this.ncol + colIndex];
  }

  transpose(): number[][] {
    const matrix2D = this.to2D();
    const transposed: number[][] = [];
    for (let i = 0; i < this.ncol; i++) {
      transposed[i] = [];
      for (let j = 0; j < this.nrow; j++) {
        transposed[i][j] = matrix2D[j][i];
      }
    }
    return transposed;
  }

  getData(): number[] {
    return this.data;
  }
}
