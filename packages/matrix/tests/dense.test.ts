import { DenseMatrix } from '../src/dense';

describe('DenseMatrix', () => {
  test('création et get/set', () => {
    const A = new DenseMatrix(2, 3);
    A.set(0, 0, 1);
    A.set(1, 2, 5);
    expect(A.get(0, 0)).toBe(1);
    expect(A.get(1, 2)).toBe(5);
    expect(A.rows).toBe(2);
    expect(A.cols).toBe(3);
  });

  test('add/sub', () => {
    const A = DenseMatrix.from2D([
      [1, 2],
      [3, 4],
    ]);
    const B = DenseMatrix.from2D([
      [5, 6],
      [7, 8],
    ]);
    const C = A.add(B) as DenseMatrix;
    expect((C as DenseMatrix).get(0, 0)).toBe(6);
    expect((C as DenseMatrix).get(1, 1)).toBe(12);
    const D = B.sub(A) as DenseMatrix;
    expect(D.get(0, 0)).toBe(4);
    expect(D.get(1, 1)).toBe(4);
  });

  test('transpose', () => {
    const A = DenseMatrix.from2D([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const T = A.transpose() as DenseMatrix;
    expect(T.rows).toBe(3);
    expect(T.cols).toBe(2);
    expect(T.get(0, 0)).toBe(1);
    expect(T.get(2, 1)).toBe(6);
  });

  test('matvec', () => {
    const A = DenseMatrix.from2D([
      [1, 2],
      [3, 4],
    ]);
    const x = new Float64Array([2, 1]);
    const y = A.matvec(x);
    expect(Array.from(y)).toEqual([1 * 2 + 2 * 1, 3 * 2 + 4 * 1]);
  });

  test('matmul', () => {
    const A = DenseMatrix.from2D([
      [1, 2],
      [3, 4],
    ]);
    const B = DenseMatrix.from2D([
      [5, 6],
      [7, 8],
    ]);
    const C = A.mul(B) as DenseMatrix;
    expect(C.get(0, 0)).toBe(1 * 5 + 2 * 7);
    expect(C.get(0, 1)).toBe(1 * 6 + 2 * 8);
    expect(C.get(1, 0)).toBe(3 * 5 + 4 * 7);
    expect(C.get(1, 1)).toBe(3 * 6 + 4 * 8);
  });
});
