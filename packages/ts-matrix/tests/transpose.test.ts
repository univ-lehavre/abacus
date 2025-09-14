import { transpose } from '../src';

describe('transpose', () => {
  it('transpose une matrice plate 2x3 en 3x2', () => {
    // [1,2,3,4,5,6] (2x3) => [[1,2,3],[4,5,6]]
    // transpose => [[1,4],[2,5],[3,6]] => [1,4,2,5,3,6]
    const A = [1, 2, 3, 4, 5, 6];
    const result = transpose(A, 2, 3);
    expect(result).toEqual([1, 4, 2, 5, 3, 6]);
  });

  it('transpose une matrice plate 3x2 en 2x3', () => {
    // [1,2,3,4,5,6] (3x2) => [[1,2],[3,4],[5,6]]
    // transpose => [[1,3,5],[2,4,6]] => [1,3,5,2,4,6]
    const A = [1, 2, 3, 4, 5, 6];
    const result = transpose(A, 3, 2);
    expect(result).toEqual([1, 3, 5, 2, 4, 6]);
  });

  it('gère les tableaux vides', () => {
    expect(transpose([], 0, 0)).toEqual([]);
  });

  it('transpose une matrice carrée 3x3', () => {
    const A = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = transpose(A, 3, 3);
    expect(result).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });

  it("transpose d'un vecteur ligne 1x4 et vecteur colonne 4x1 (plat invariants)", () => {
    const rowVec = [1, 2, 3, 4];
    const asRow = transpose(rowVec, 1, 4); // 1x4 -> 4x1
    expect(asRow).toEqual([1, 2, 3, 4]);

    const colVec = [1, 2, 3, 4];
    const asCol = transpose(colVec, 4, 1); // 4x1 -> 1x4
    expect(asCol).toEqual([1, 2, 3, 4]);
  });

  it("ne modifie pas le tableau d'entrée (immutabilité)", () => {
    const A = [1, 2, 3, 4, 5, 6];
    const copy = A.slice();
    transpose(A, 2, 3);
    expect(A).toEqual(copy);
  });

  it('double transpose renvoie la matrice d origine (idempotence)', () => {
    const cases = [
      { A: [1, 2, 3, 4, 5, 6], r: 2, c: 3 },
      { A: [1, 2, 3, 4, 5, 6], r: 3, c: 2 },
      { A: [1, 2, 3, 4, 5, 6, 7, 8, 9], r: 3, c: 3 },
      { A: [1, 2, 3, 4], r: 1, c: 4 },
    ];

    for (const { A, r, c } of cases) {
      const t = transpose(A, r, c);
      const tt = transpose(t, c, r);
      expect(tt).toEqual(A);
    }
  });

  it('gère les flottants et valeurs négatives', () => {
    const A = [1.5, -2.25, 3.25, 4.125];
    const result = transpose(A, 2, 2);
    expect(result).toEqual([1.5, 3.25, -2.25, 4.125]);
  });

  it('la longueur de sortie est rows*cols inversés', () => {
    const A = [1, 2, 3, 4, 5, 6];
    const out = transpose(A, 2, 3);
    expect(out.length).toBe(3 * 2);
  });
});
