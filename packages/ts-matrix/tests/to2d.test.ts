import { DenseMatrix } from '../src/dense-matrix';

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
