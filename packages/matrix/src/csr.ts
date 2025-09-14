import type { IMatrix } from './types';
import { DenseMatrix } from './dense';

/**
 * Représentation clairsemée au format CSR (Compressed Sparse Row).
 *
 * Stocke uniquement les éléments non nuls ligne par ligne:
 * - `values[k]` contient la valeur du k-ième élément non nul
 * - `colIndex[k]` contient l'indice de colonne de `values[k]`
 * - `rowPtr[i]` est l'offset de début de la ligne i dans `values`/`colIndex`
 *   (avec `rowPtr.length === rows + 1` et `rowPtr[rows] === values.length`)
 *
 * Invariants:
 * - Pour chaque ligne i, la sous-plage k ∈ [rowPtr[i], rowPtr[i+1]) est triée par `colIndex[k]` strictement croissant.
 * - `values.length === colIndex.length`
 *
 * Avantages: faible mémoire quand la matrice est creuse, itérations par ligne efficaces,
 * produit matrice-vecteur O(nnz).
 */
export class CSRMatrix implements IMatrix {
  /** Nombre de lignes. */
  readonly rows: number;
  /** Nombre de colonnes. */
  readonly cols: number;
  /** Valeurs non nulles, de longueur nnz. */
  values: Float64Array;
  /** Indices de colonnes pour chaque valeur non nulle, de longueur nnz. */
  colIndex: Uint32Array;
  /** Offsets de début de lignes (taille rows+1). */
  rowPtr: Uint32Array;

  /**
   * Construit une matrice CSR.
   * @param rows Nombre de lignes
   * @param cols Nombre de colonnes
   * @param values Tableau des valeurs non nulles (taille nnz)
   * @param colIndex Indices de colonnes associés à chaque valeur (taille nnz)
   * @param rowPtr Pointeurs de début de lignes (taille rows+1), avec rowPtr[0] = 0 et rowPtr[rows] = nnz
   * @throws {Error} Si les tailles sont incohérentes ou si rowPtr n’est pas cohérent
   */
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

  /**
   * Construit une CSR à partir d'une liste de triplets (COO).
   * Les entrées sont triées par (i, j) et compressées par lignes.
   * Les valeurs nulles ne sont pas filtrées automatiquement; fournissez des entrées v ≠ 0.
   * @param rows Nombre de lignes
   * @param cols Nombre de colonnes
   * @param entries Triplets (i, j, v) avec 0 ≤ i < rows et 0 ≤ j < cols
   * @returns CSRMatrix
   */
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

  /**
   * Convertit une matrice dense en CSR en collectant les valeurs non nulles.
   * @param A Matrice dense source
   * @returns CSRMatrix équivalente
   */
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

  /**
   * Retourne la valeur A[i,j]. Renvoie 0 si l’entrée n’existe pas dans la structure CSR.
   * @param i Ligne (0 ≤ i < rows)
   * @param j Colonne (0 ≤ j < cols)
   * @throws {RangeError} Si i ou j sont hors bornes
   */
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

  /**
   * Modifie la valeur A[i,j]. Opération coûteuse: la structure est reconstruite naïvement.
   * Pour des mises à jour massives, préférez construire depuis un COO ou un builder dédié.
   * @param i Ligne (0 ≤ i < rows)
   * @param j Colonne (0 ≤ j < cols)
   * @param value Nouvelle valeur
   * @throws {RangeError} Si i ou j sont hors bornes
   */
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

  /**
   * Addition matricielle A + B. Si B est CSR, renvoie une CSR; sinon conversion dense.
   * @param B Matrice de même dimensions
   * @returns Nouvelle matrice (CSR si B est CSR)
   * @throws {Error} Si les dimensions sont incompatibles
   */
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

  /**
   * Soustraction matricielle A - B. Si B est CSR, renvoie une CSR; sinon conversion dense.
   * @param B Matrice de même dimensions
   * @returns Nouvelle matrice (CSR si B est CSR)
   * @throws {Error} Si les dimensions sont incompatibles
   */
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

  /**
   * Multiplication par scalaire ou produit matriciel.
   * - Si B est un nombre: renvoie une CSR avec valeurs mises à l’échelle.
   * - Si B est Dense: renvoie une DenseMatrix (chemin optimisé CSR*Dense → Dense).
   * - Si B est CSR: renvoie une CSR (algorithme deux passes: précomptage puis accumulation).
   * @param B Scalaire ou matrice à multiplier
   * @returns Nouvelle matrice (CSR si A et B sont CSR)
   * @throws {Error} Si les dimensions sont incompatibles pour un produit matriciel
   */
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
      // CSR * CSR -> CSR
      // Implémentation deux passes avec précomptage des nnz par ligne
      const rows = this.rows;
      const cols = B.cols;

      // Pass 1: compter le nombre d'indices colonnes uniques par ligne du résultat
      const rowCounts = new Uint32Array(rows);
      const marker = new Int32Array(cols);
      marker.fill(-1);
      for (let i = 0; i < rows; i++) {
        const aStart = this.rowPtr[i];
        const aEnd = this.rowPtr[i + 1];
        for (let ak = aStart; ak < aEnd; ak++) {
          const k = this.colIndex[ak];
          const bStart = B.rowPtr[k];
          const bEnd = B.rowPtr[k + 1];
          for (let bk = bStart; bk < bEnd; bk++) {
            const j = B.colIndex[bk];
            if (marker[j] !== i) {
              marker[j] = i;
              rowCounts[i]++;
            }
          }
        }
      }

      // Préfixe pour rowPtr (borne supérieure, avant élagage des zéros après accumulation)
      const rowPtr = new Uint32Array(rows + 1);
      for (let r = 0; r < rows; r++) rowPtr[r + 1] = rowPtr[r] + rowCounts[r];
      const cap = rowPtr[rows];
      const values = new Float64Array(cap);
      const colIndex = new Uint32Array(cap);

      // Pass 2: accumuler les valeurs dans les buffers alloués
      // Utilise marker et une table de position pour placer/sommer
      marker.fill(-1);
      const pos = new Int32Array(cols);
      for (let i = 0; i < rows; i++) {
        let cursor = rowPtr[i];
        const aStart = this.rowPtr[i];
        const aEnd = this.rowPtr[i + 1];
        for (let ak = aStart; ak < aEnd; ak++) {
          const k = this.colIndex[ak];
          const aik = this.values[ak];
          if (aik === 0) continue;
          const bStart = B.rowPtr[k];
          const bEnd = B.rowPtr[k + 1];
          for (let bk = bStart; bk < bEnd; bk++) {
            const j = B.colIndex[bk];
            const prod = aik * B.values[bk];
            if (prod === 0) continue;
            if (marker[j] !== i) {
              marker[j] = i;
              pos[j] = cursor;
              colIndex[cursor] = j;
              values[cursor] = prod;
              cursor++;
            } else {
              values[pos[j]] += prod;
            }
          }
        }

        // Compacter la ligne: trier par colonnes, fusionner doublons éventuels, supprimer zéros
        const start = rowPtr[i];
        const len = cursor - start;
        if (len <= 0) {
          rowPtr[i + 1] = start;
        } else {
          // Copier la portion de ligne pour éviter l'écrasement lors du tri
          const colsTmp = new Uint32Array(len);
          const valsTmp = new Float64Array(len);
          for (let t = 0; t < len; t++) {
            colsTmp[t] = colIndex[start + t];
            valsTmp[t] = values[start + t];
          }
          // Indices locaux [0..len)
          const order: number[] = new Array(len);
          for (let t = 0; t < len; t++) order[t] = t;
          order.sort((a, b) => colsTmp[a] - colsTmp[b]);
          // Réécriture compacte triée avec fusion et élagage
          let w = start;
          for (let idx = 0; idx < order.length; idx++) {
            const t = order[idx];
            const j = colsTmp[t];
            const v = valsTmp[t];
            if (v === 0) continue;
            if (w > start && j === colIndex[w - 1]) {
              // fusionner avec l'entrée précédente
              const sum = values[w - 1] + v;
              if (sum !== 0) values[w - 1] = sum;
              else w--; // supprime l'entrée si annulation exacte
            } else {
              colIndex[w] = j;
              values[w] = v;
              w++;
            }
          }
          rowPtr[i + 1] = w;
        }
      }

      // Taille finale après élagage
      const nnz = rowPtr[rows];
      const outValues = values.slice(0, nnz);
      const outColIndex = colIndex.slice(0, nnz);
      return new CSRMatrix(rows, cols, outValues, outColIndex, rowPtr);
    }
    return this.mul(B.toDense());
  }

  /**
   * Transposée de la matrice (CSR -> CSR) via reconstruction à partir d’un COO transposé.
   * @returns CSRMatrix transposée
   */
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

  /**
   * Produit matrice-vecteur y = A x.
   * @param x Vecteur de taille `cols`
   * @returns y de taille `rows`
   * @throws {Error} Si la taille du vecteur est incompatible
   */
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

  /**
   * Conversion vers une matrice Dense équivalente.
   * @returns DenseMatrix copie des données
   */
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
