import { nnmf, clampNonNeg, reconstructionError, updateH, updateW } from '../src';

import { DenseMatrix } from '../src';

describe('nnmf utils', () => {
  it('clampNonNeg met à zéro les négatifs', () => {
    expect(clampNonNeg([1, -2, 0, 3])).toEqual([1, 0, 0, 3]);
  });

  it('reconstructionError calcule l’erreur quadratique', () => {
    expect(reconstructionError([1, 2, 3], [1, 2, 4])).toBeCloseTo(1);
  });

  it('updateH met à jour H', () => {
    // Test simple : matrices 2x2, valeurs positives
    const W = [1, 2, 3, 4];
    const H = [1, 1, 1, 1];
    const V = [5, 6, 7, 8];
    const result = updateH(W, H, V, 2, 2, 2);
    expect(result.length).toBe(4);
    expect(result.every(v => v >= 0)).toBe(true);
  });

  it('updateW met à jour W', () => {
    const W = [1, 1, 1, 1];
    const H = [1, 2, 3, 4];
    const V = [5, 6, 7, 8];
    const result = updateW(W, H, V, 2, 2, 2);
    expect(result.length).toBe(4);
    expect(result.every(v => v >= 0)).toBe(true);
  });
});

describe('nnmf', () => {
  it('factorise une matrice simple', () => {
    // Matrice 2x2
    const data = new DenseMatrix([1, 2, 3, 4], { ncol: 2, nonNegative: true });
    const [W, H] = nnmf(data, 2);
    expect(W).toBeInstanceOf(DenseMatrix);
    expect(H).toBeInstanceOf(DenseMatrix);
    // Les valeurs doivent être non-négatives
    expect(W['data'].every((v: number) => v >= 0)).toBe(true);
    expect(H['data'].every((v: number) => v >= 0)).toBe(true);
  });
});
