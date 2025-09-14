import { DenseMatrix } from '../src/dense-matrix';

describe("DenseMatrix.transpose (méthode d'instance)", () => {
  it('transpose une matrice carrée 3x3 en 3x3', () => {
    const A2D = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const m = new DenseMatrix(A2D);
    const t = m.transpose();
    expect(t).toEqual([
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ]);
    // vérifie que les dimensions sont inversées (ici identiques)
    expect(t.length).toBe(3);
    expect(t[0].length).toBe(3);
  });

  it('transpose une matrice rectangulaire 2x3 en 3x2', () => {
    const A2D = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const m = new DenseMatrix(A2D);
    const t = m.transpose();
    expect(t).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(t.length).toBe(3);
    expect(t[0].length).toBe(2);
  });

  it('transpose une matrice rectangulaire 3x2 en 2x3', () => {
    const A2D = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    const m = new DenseMatrix(A2D);
    const t = m.transpose();
    expect(t).toEqual([
      [1, 3, 5],
      [2, 4, 6],
    ]);
    expect(t.length).toBe(2);
    expect(t[0].length).toBe(3);
  });

  it('vecteur ligne 1x4 devient 4x1 et vecteur colonne 4x1 devient 1x4', () => {
    const row = new DenseMatrix([[1, 2, 3, 4]]); // 1x4
    const tr = row.transpose();
    expect(tr).toEqual([[1], [2], [3], [4]]);

    const col = new DenseMatrix([[1], [2], [3], [4]]); // 4x1
    const tc = col.transpose();
    expect(tc).toEqual([[1, 2, 3, 4]]);
  });

  it('double-transpose renvoie la matrice originale', () => {
    const cases: Array<[number[], number, number]> = [
      [[1, 2, 3, 4, 5, 6], 2, 3],
      [[1, 2, 3, 4, 5, 6], 3, 2],
      [[1, 2, 3, 4], 1, 4],
      [[1], 1, 1],
    ];

    for (const [flat, r, c] of cases) {
      // construire en 2D à partir du plat
      const A2D: number[][] = [];
      for (let i = 0; i < r; i++) A2D.push(flat.slice(i * c, (i + 1) * c));
      const m = new DenseMatrix(A2D);
      const t = m.transpose();
      const tt = new DenseMatrix(t).transpose();
      expect(tt).toEqual(A2D);
    }
  });

  it('ne modifie pas les données internes (immutabilité de la méthode)', () => {
    const A2D = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const m = new DenseMatrix(A2D);
    const originalData = m.getData().slice();
    m.transpose();
    expect(m.getData()).toEqual(originalData);
  });

  it('gère la matrice 1x1 (cas minimal)', () => {
    const one = new DenseMatrix([[42]]);
    expect(one.transpose()).toEqual([[42]]);
  });

  it('gère flottants et valeurs négatives', () => {
    const A2D = [
      [1.5, -2.25],
      [3.25, 4.125],
    ];
    const m = new DenseMatrix(A2D);
    const t = m.transpose();
    expect(t).toEqual([
      [1.5, 3.25],
      [-2.25, 4.125],
    ]);
  });

  it('comparaison élément par élément avec implémentation manuelle', () => {
    const A2D = [
      [10, 20, 30],
      [40, 50, 60],
    ];
    const m = new DenseMatrix(A2D);
    const t = m.transpose();

    // Vérifier chaque élément
    for (let i = 0; i < t.length; i++) {
      for (let j = 0; j < t[0].length; j++) {
        expect(t[i][j]).toBe(A2D[j][i]);
      }
    }
  });
});
