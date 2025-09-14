import { DenseMatrix } from '../src/dense-matrix';

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
