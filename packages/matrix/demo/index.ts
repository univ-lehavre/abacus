import { DenseMatrix } from '../src/dense';
import { CSRMatrix } from '../src/csr';

// Dense example
const A = DenseMatrix.from2D([
  [1, 2],
  [3, 4],
]);
const B = DenseMatrix.identity(2);
const C = A.mul(B) as DenseMatrix;
console.log('Dense A*I =', Array.from(C.data));

// CSR example
const S = CSRMatrix.fromCOO(2, 3, [
  { i: 0, j: 0, v: 1 },
  { i: 0, j: 2, v: 2 },
  { i: 1, j: 1, v: 3 },
]);
const D = S.mul(
  DenseMatrix.from2D([
    [1, 0],
    [0, 1],
    [2, -1],
  ]),
) as DenseMatrix;
console.log('CSR * Dense =', Array.from(D.data));

const x = new Float64Array([2, 1]);
console.log('A*x =', Array.from(A.matvec(x)));
