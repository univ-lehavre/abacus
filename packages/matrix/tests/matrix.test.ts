import { Matrix } from '../src/matrix';

describe('Matrix auto backend', () => {
  test('from2D chooses CSR for sparse', () => {
    const M = Matrix.from2D(
      [
        [1, 0, 0, 0],
        [0, 0, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 3, 0],
      ],
      0.2,
    );
    expect(M.backend).toBe('csr');
    expect(M.get(0, 0)).toBe(1);
    expect(M.get(1, 3)).toBe(2);
    expect(M.get(3, 2)).toBe(3);
  });

  test('from2D chooses Dense for dense data', () => {
    const M = Matrix.from2D(
      [
        [1, 2],
        [3, 4],
      ],
      0.2,
    );
    expect(M.backend).toBe('dense');
    expect(M.get(1, 0)).toBe(3);
  });

  test('operations delegate and wrap', () => {
    const A = Matrix.from2D(
      [
        [1, 0],
        [0, 2],
      ],
      0.2,
    );
    const B = Matrix.from2D(
      [
        [0, 3],
        [4, 0],
      ],
      0.2,
    );
    const C = A.add(B) as Matrix;
    expect(C instanceof Matrix).toBe(true);
    expect(C.backend === 'csr' || C.backend === 'dense').toBe(true);
    const D = A.mul(B) as Matrix;
    expect(D.get(0, 0)).toBe(0);
    expect(D.get(0, 1)).toBe(3);
    expect(D.get(1, 0)).toBe(8);
    expect(D.get(1, 1)).toBe(0);
  });

  test('identity selects CSR for large n', () => {
    const I = Matrix.identity(10, 0.2);
    expect(I.backend).toBe('csr');
    expect(I.get(0, 0)).toBe(1);
    expect(I.get(9, 9)).toBe(1);
  });
});
