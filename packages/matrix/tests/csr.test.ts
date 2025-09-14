import { CSRMatrix } from '../src/csr';
import { DenseMatrix } from '../src/dense';

describe('CSRMatrix', () => {
  test('fromCOO et get', () => {
    const csr = CSRMatrix.fromCOO(3, 3, [
      { i: 0, j: 0, v: 1 },
      { i: 1, j: 2, v: 5 },
      { i: 2, j: 1, v: -2 },
    ]);
    expect(csr.get(0, 0)).toBe(1);
    expect(csr.get(1, 2)).toBe(5);
    expect(csr.get(2, 2)).toBe(0);
  });

  test('toDense', () => {
    const csr = CSRMatrix.fromCOO(2, 3, [
      { i: 0, j: 1, v: 4 },
      { i: 1, j: 2, v: 7 },
    ]);
    const A = csr.toDense();
    expect(A.get(0, 1)).toBe(4);
    expect(A.get(1, 2)).toBe(7);
    expect(A.get(0, 2)).toBe(0);
  });

  test('add CSR+CSR', () => {
    const A = CSRMatrix.fromCOO(2, 2, [
      { i: 0, j: 0, v: 1 },
      { i: 1, j: 1, v: 2 },
    ]);
    const B = CSRMatrix.fromCOO(2, 2, [
      { i: 0, j: 1, v: 3 },
      { i: 1, j: 1, v: 4 },
    ]);
    const C = A.add(B);
    const D = (C as CSRMatrix).toDense();
    expect(D.get(0, 0)).toBe(1);
    expect(D.get(0, 1)).toBe(3);
    expect(D.get(1, 1)).toBe(6);
  });

  test('mul CSR*Dense', () => {
    const A = CSRMatrix.fromCOO(2, 3, [
      { i: 0, j: 0, v: 1 },
      { i: 0, j: 2, v: 2 },
      { i: 1, j: 1, v: 3 },
    ]);
    const B = DenseMatrix.from2D([
      [1, 2],
      [0, 1],
      [4, -1],
    ]);
    const C = A.mul(B) as DenseMatrix;
    expect(C.get(0, 0)).toBe(1 * 1 + 2 * 4);
    expect(C.get(0, 1)).toBe(1 * 2 + 2 * -1);
    expect(C.get(1, 0)).toBe(3 * 0);
    expect(C.get(1, 1)).toBe(3 * 1);
  });
});
