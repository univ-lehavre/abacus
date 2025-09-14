import { DenseMatrix } from '../src/dense-matrix';

describe('DenseMatrix.getRow & getCol', () => {
  it('récupère correctement les lignes et colonnes dans une matrice carrée', () => {
    const mat = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    expect(mat.getRow(0)).toEqual([1, 2]);
    expect(mat.getRow(1)).toEqual([3, 4]);
    expect(mat.getCol(0)).toEqual([1, 3]);
    expect(mat.getCol(1)).toEqual([2, 4]);
  });

  it('fonctionne pour matrices rectangulaires (2x3 et 3x2)', () => {
    const m2x3 = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 3, nonNegative: false });
    expect(m2x3.getRow(0)).toEqual([1, 2, 3]);
    expect(m2x3.getRow(1)).toEqual([4, 5, 6]);
    expect(m2x3.getCol(0)).toEqual([1, 4]);
    expect(m2x3.getCol(1)).toEqual([2, 5]);
    expect(m2x3.getCol(2)).toEqual([3, 6]);

    const m3x2 = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 2, nonNegative: false });
    expect(m3x2.getRow(0)).toEqual([1, 2]);
    expect(m3x2.getRow(1)).toEqual([3, 4]);
    expect(m3x2.getRow(2)).toEqual([5, 6]);
    expect(m3x2.getCol(0)).toEqual([1, 3, 5]);
    expect(m3x2.getCol(1)).toEqual([2, 4, 6]);
  });

  it('gère les matrices 1xN et Nx1', () => {
    const row = new DenseMatrix([7, 8, 9], { ncol: 3, nonNegative: false });
    expect(row.getRow(0)).toEqual([7, 8, 9]);
    expect(row.getCol(0)).toEqual([7]);
    expect(row.getCol(1)).toEqual([8]);
    expect(row.getCol(2)).toEqual([9]);

    const col = new DenseMatrix([10, 11, 12], { ncol: 1, nonNegative: false });
    expect(col.getCol(0)).toEqual([10, 11, 12]);
    expect(col.getRow(0)).toEqual([10]);
    expect(col.getRow(1)).toEqual([11]);
    expect(col.getRow(2)).toEqual([12]);
  });

  it('ne modifie pas les données internes lorsqu’on modifie le tableau renvoyé', () => {
    const mat = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    const r = mat.getRow(0);
    r[0] = 999;
    expect(mat.getRow(0)).toEqual([1, 2]);

    const c = mat.getCol(1);
    c[0] = 888;
    expect(mat.getCol(1)).toEqual([2, 4]);
  });

  it('lève une erreur pour indices hors bornes', () => {
    const mat = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    expect(() => mat.getRow(-1)).toThrow();
    expect(() => mat.getRow(2)).toThrow();
    expect(() => mat.getCol(-1)).toThrow();
    expect(() => mat.getCol(2)).toThrow();
  });

  it('retourne des tableaux de la bonne longueur', () => {
    const mat = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 3, nonNegative: false });
    expect(mat.getRow(0)).toHaveLength(3);
    expect(mat.getRow(1)).toHaveLength(3);
    expect(mat.getCol(0)).toHaveLength(2);
    expect(mat.getCol(1)).toHaveLength(2);
    expect(mat.getCol(2)).toHaveLength(2);
  });

  it('coïncide avec to2D/toDense pour valeurs aléatoires', () => {
    const sizes = [
      { nrow: 2, ncol: 3 },
      { nrow: 4, ncol: 1 },
      { nrow: 1, ncol: 4 },
      { nrow: 5, ncol: 5 },
    ];

    for (const s of sizes) {
      const arr = Array.from({ length: s.nrow * s.ncol }, (_, i) => i + 1);
      const mat = new DenseMatrix(arr, { ncol: s.ncol, nonNegative: false });
      const dense = mat.to2D();
      for (let r = 0; r < s.nrow; r++) {
        expect(mat.getRow(r)).toEqual(dense[r]);
      }
      for (let c = 0; c < s.ncol; c++) {
        const colFrom2D = dense.map(row => row[c]);
        expect(mat.getCol(c)).toEqual(colFrom2D);
      }
    }
  });
});
