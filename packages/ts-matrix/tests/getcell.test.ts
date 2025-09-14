import { DenseMatrix } from '../src/dense-matrix';

describe('DenseMatrix.getCell', () => {
  it('renvoie la bonne valeur pour une matrice carrée', () => {
    const m = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    expect(m.getCell(0, 0)).toBe(1);
    expect(m.getCell(0, 1)).toBe(2);
    expect(m.getCell(1, 0)).toBe(3);
    expect(m.getCell(1, 1)).toBe(4);
  });

  it('fonctionne pour matrices rectangulaires (2x3 et 3x2)', () => {
    const m2x3 = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 3, nonNegative: false });
    expect(m2x3.getCell(0, 0)).toBe(1);
    expect(m2x3.getCell(0, 2)).toBe(3);
    expect(m2x3.getCell(1, 1)).toBe(5);

    const m3x2 = new DenseMatrix([7, 8, 9, 10, 11, 12], { ncol: 2, nonNegative: false });
    expect(m3x2.getCell(2, 1)).toBe(12);
    expect(m3x2.getCell(1, 0)).toBe(9);
  });

  it('gère les vecteurs ligne et colonne (1xN et Nx1)', () => {
    const row = new DenseMatrix([7, 8, 9], { ncol: 3, nonNegative: false });
    expect(row.getCell(0, 0)).toBe(7);
    expect(row.getCell(0, 2)).toBe(9);

    const col = new DenseMatrix([10, 11, 12], { ncol: 1, nonNegative: false });
    expect(col.getCell(0, 0)).toBe(10);
    expect(col.getCell(2, 0)).toBe(12);
  });

  it('fonctionne pour 1x1', () => {
    const single = new DenseMatrix([42], { ncol: 1, nonNegative: false });
    expect(single.getCell(0, 0)).toBe(42);
  });

  it('gère des valeurs flottantes et négatives', () => {
    const mat = new DenseMatrix([1.5, -2.2, 3.14, 0], { ncol: 2, nonNegative: false });
    expect(mat.getCell(0, 0)).toBeCloseTo(1.5);
    expect(mat.getCell(0, 1)).toBeCloseTo(-2.2);
    expect(mat.getCell(1, 0)).toBeCloseTo(3.14);
    expect(mat.getCell(1, 1)).toBeCloseTo(0);
  });

  it('lève une erreur pour indices hors bornes', () => {
    const mat = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    expect(() => mat.getCell(-1, 0)).toThrow();
    expect(() => mat.getCell(0, -1)).toThrow();
    expect(() => mat.getCell(2, 0)).toThrow();
    expect(() => mat.getCell(0, 2)).toThrow();
  });

  it('coïncide avec to2D pour plusieurs tailles aléatoires', () => {
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
        for (let c = 0; c < s.ncol; c++) {
          expect(mat.getCell(r, c)).toBe(dense[r][c]);
        }
      }
    }
  });

  it('appel répété renvoie la même valeur (imprévisibilité mutation)', () => {
    const mat = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 3, nonNegative: false });
    expect(mat.getCell(1, 2)).toBe(6);
    // rappeler plusieurs fois
    expect(mat.getCell(1, 2)).toBe(6);
    expect(mat.getCell(1, 2)).toBe(6);
  });
});
