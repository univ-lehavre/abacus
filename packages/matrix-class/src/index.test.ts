import { DenseMatrix } from '.';

describe('DenseMatrix', () => {
  it('crée une matrice dense valide', () => {
    const mat = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    expect(mat.nRows).toBe(2);
    expect(mat.nCols).toBe(2);
    expect(mat.getData()).toEqual([1, 2, 3, 4]);
    expect(mat.toDense()).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('ne lève pas d’erreur si data contient des valeurs négatives', () => {
    expect(() => new DenseMatrix([1, -2, 3, 4], { ncol: 2, nonNegative: false })).not.toThrow();
  });
  it('lève une erreur si data contient des valeurs négatives et qu’une validation est demandée', () => {
    expect(() => new DenseMatrix([1, -2, 3, 4], { ncol: 2, nonNegative: true })).toThrow();
  });

  it('lève une erreur si data contient des valeurs non numériques', () => {
    // @ts-expect-error test valeur non numérique
    expect(() => new DenseMatrix([1, 'a', 3, 4], { ncol: 2, nonNegative: false })).toThrow();
  });
  it('getData retourne le tableau plat d’origine', () => {
    const mat = new DenseMatrix([7, 8, 9, 10], { ncol: 2, nonNegative: false });
    expect(mat.getData()).toEqual([7, 8, 9, 10]);
  });

  it('lève une erreur si la taille ne correspond pas au nombre de colonnes', () => {
    expect(() => new DenseMatrix([1, 2, 3], { ncol: 2, nonNegative: false })).toThrow();
    expect(() => new DenseMatrix([1, 2, 3, 4, 5], { ncol: 2, nonNegative: false })).toThrow();
  });

  it('retourne les bonnes dimensions pour une matrice rectangulaire', () => {
    const mat = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 3, nonNegative: false });
    expect(mat.nRows).toBe(2);
    expect(mat.nCols).toBe(3);
    expect(mat.toDense()).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });
});

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

describe('DenseMatrix.to2D', () => {
  it('convertit un tableau plat en 2D (construction flat)', () => {
    const mat = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: false });
    expect(mat.to2D()).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('retourne la même forme lorsqu’on construit à partir d’un tableau 2D', () => {
    const input = [
      [5, 6],
      [7, 8],
    ];
    const mat = new DenseMatrix(input, { nonNegative: false });
    expect(mat.to2D()).toEqual(input);
  });

  it('gère les matrices rectangulaires (2x3 et 3x2)', () => {
    const m2x3 = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 3, nonNegative: false });
    expect(m2x3.to2D()).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);

    const m3x2 = new DenseMatrix([1, 2, 3, 4, 5, 6], { ncol: 2, nonNegative: false });
    expect(m3x2.to2D()).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('gère une seule ligne et une seule colonne', () => {
    const singleRow = new DenseMatrix([1, 2, 3], { ncol: 3, nonNegative: false });
    expect(singleRow.to2D()).toEqual([[1, 2, 3]]);

    const singleCol = new DenseMatrix([1, 2, 3], { ncol: 1, nonNegative: false });
    expect(singleCol.to2D()).toEqual([[1], [2], [3]]);
  });

  it('ne modifie pas les données internes si on mutile la structure renvoyée', () => {
    const mat = new DenseMatrix([9, 8, 7, 6], { ncol: 2, nonNegative: false });
    const view = mat.to2D();
    // modification locale
    view[0][0] = 999;
    // les données internes restent inchangées (primitives)
    expect(mat.getData()[0]).toBe(9);
  });

  it('coïncide toujours avec toDense pour plusieurs tailles aléatoires', () => {
    const sizes = [
      { nrow: 1, ncol: 1 },
      { nrow: 1, ncol: 5 },
      { nrow: 5, ncol: 1 },
      { nrow: 4, ncol: 6 },
      { nrow: 7, ncol: 3 },
    ];

    for (const s of sizes) {
      const arr: number[] = Array.from({ length: s.nrow * s.ncol }, (_, i) => i + 1);
      const mat = new DenseMatrix(arr, { ncol: s.ncol, nonNegative: false });
      expect(mat.to2D()).toEqual(mat.toDense());
    }
  });
});
