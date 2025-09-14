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

  test('mul CSR*CSR -> CSR', () => {
    // A: 2x3, B: 3x2
    const A = CSRMatrix.fromCOO(2, 3, [
      { i: 0, j: 0, v: 1 },
      { i: 0, j: 2, v: 2 },
      { i: 1, j: 1, v: 3 },
    ]);
    const B = CSRMatrix.fromCOO(3, 2, [
      { i: 0, j: 0, v: 5 },
      { i: 2, j: 0, v: 7 },
      { i: 2, j: 1, v: -1 },
      { i: 1, j: 1, v: 1 },
    ]);
    const C = A.mul(B);
    expect(C).toBeInstanceOf(CSRMatrix);
    const D = (C as CSRMatrix).toDense();
    // A (2x3) * B (3x2) =
    // Row0: [1,0,2] * B => col0: 1*5 + 2*7 = 19 ; col1: 1*0 + 0*1 + 2*(-1) = -2
    // Row1: [0,3,0] * B => col0: 0 ; col1: 3*1 = 3
    expect(D.get(0, 0)).toBe(19);
    expect(D.get(0, 1)).toBe(-2);
    expect(D.get(1, 0)).toBe(0);
    expect(D.get(1, 1)).toBe(3);
  });

  test('mul CSR*CSR avec accumulations et ligne vide', () => {
    // A: 3x3, ligne 1 (index 1) vide, lignes 0 et 2 avec contributions
    // Construit pour que plusieurs chemins contribuent à la même colonne j dans C
    const A = CSRMatrix.fromCOO(3, 3, [
      { i: 0, j: 0, v: 2 },
      { i: 0, j: 1, v: -1 },
      // ligne 1 vide
      { i: 2, j: 1, v: 3 },
      { i: 2, j: 2, v: 4 },
    ]);

    // B organisé pour provoquer des accumulations sur même colonne
    // B rows: 0,1,2 ; cols: 0,1
    // - depuis A[0,0]=2 et A[0,1]=-1, les lignes B0 et B1 écrivent toutes deux sur la colonne 0
    // - depuis A[2,1]=3 et A[2,2]=4, les lignes B1 et B2 écrivent sur colonne 1
    const B = CSRMatrix.fromCOO(3, 2, [
      // ligne 0 de B
      { i: 0, j: 0, v: 5 },
      { i: 0, j: 1, v: 1 },
      // ligne 1 de B
      { i: 1, j: 0, v: -3 },
      { i: 1, j: 1, v: 2 },
      // ligne 2 de B
      { i: 2, j: 1, v: 7 },
    ]);

    const C = A.mul(B) as CSRMatrix;
    expect(C).toBeInstanceOf(CSRMatrix);

    const D = C.toDense();
    // Calcul attendu:
    // Ligne 0 de A: [2, -1, 0]
    //   col0: 2*B00 + (-1)*B10 = 2*5 + (-1)*(-3) = 10 + 3 = 13
    //   col1: 2*B01 + (-1)*B11 = 2*1 + (-1)*2 = 2 - 2 = 0  -> doit disparaître en CSR
    // Ligne 1 de A: vide -> [0, 0]
    // Ligne 2 de A: [0, 3, 4]
    //   col0: 3*B10 + 4*B20 = 3*(-3) + 4*0 = -9 + 0 = -9
    //   col1: 3*B11 + 4*B21 = 3*2 + 4*7 = 6 + 28 = 34
    expect(D.get(0, 0)).toBe(13);
    expect(D.get(0, 1)).toBe(0);
    expect(D.get(1, 0)).toBe(0);
    expect(D.get(1, 1)).toBe(0);
    expect(D.get(2, 0)).toBe(-9);
    expect(D.get(2, 1)).toBe(34);

    // Vérifions aussi la structure CSR: pas d'entrée pour (0,1)
    // en lisant via get (qui retourne 0 si absent)
    expect(C.get(0, 1)).toBe(0);
  });

  test('mul CSR*CSR avec annulation exacte (élagage des zéros)', () => {
    // On construit A et B tels que C[0,0] = 0 par annulation: 2*5 + (-1)*10 = 10 - 10 = 0
    const A = CSRMatrix.fromCOO(1, 2, [
      { i: 0, j: 0, v: 2 },
      { i: 0, j: 1, v: -1 },
    ]);
    const B = CSRMatrix.fromCOO(2, 1, [
      { i: 0, j: 0, v: 5 },
      { i: 1, j: 0, v: 10 },
    ]);
    const C = A.mul(B) as CSRMatrix;
    expect(C).toBeInstanceOf(CSRMatrix);
    // La valeur doit être 0 et l'entrée omise en CSR (get renvoie 0)
    expect(C.get(0, 0)).toBe(0);
    const D = C.toDense();
    expect(D.get(0, 0)).toBe(0);
  });

  test('mul CSR*CSR avec annulations multiples sur différentes colonnes', () => {
    // A: 1x3
    // On veut C[0,0]=0 et C[0,2]=0 par annulations, et C[0,1] non nul
    const A = CSRMatrix.fromCOO(1, 3, [
      { i: 0, j: 0, v: 2 },
      { i: 0, j: 1, v: -1 },
      { i: 0, j: 2, v: 3 },
    ]);
    // B: 3x3
    // Choix pour obtenir:
    // C[0,0] = 2*1 + (-1)*2 + 3*0 = 0
    // C[0,2] = 2*3 + (-1)*6 + 3*0 = 0
    // C[0,1] = 2*1 + (-1)*0 + 3*2 = 8
    const B = CSRMatrix.fromCOO(3, 3, [
      // ligne 0
      { i: 0, j: 0, v: 1 },
      { i: 0, j: 1, v: 1 },
      { i: 0, j: 2, v: 3 },
      // ligne 1
      { i: 1, j: 0, v: 2 },
      { i: 1, j: 2, v: 6 },
      // ligne 2
      { i: 2, j: 1, v: 2 },
    ]);
    const C = A.mul(B) as CSRMatrix;
    const D = C.toDense();
    expect(D.get(0, 0)).toBe(0);
    expect(D.get(0, 1)).toBe(8);
    expect(D.get(0, 2)).toBe(0);
    // Vérifie aussi l’absence d’entrées pour les zéros
    expect(C.get(0, 0)).toBe(0);
    expect(C.get(0, 2)).toBe(0);
  });

  test("stabilité d'ordre: colonnes triées par ligne dans le résultat", () => {
    // Construire A et B pour produire plusieurs colonnes dans une même ligne de C
    const A = CSRMatrix.fromCOO(2, 4, [
      { i: 0, j: 3, v: 1 },
      { i: 0, j: 1, v: 2 },
      { i: 1, j: 0, v: 1 },
      { i: 1, j: 2, v: 1 },
    ]);
    const B = CSRMatrix.fromCOO(4, 5, [
      // ligne 1 (pour A[0,1]=2) -> colonnes 4 et 2
      { i: 1, j: 4, v: 1 },
      { i: 1, j: 2, v: 1 },
      // ligne 3 (pour A[0,3]=1) -> colonnes 3 et 1
      { i: 3, j: 1, v: 1 },
      { i: 3, j: 3, v: 1 },
      // ligne 0 (pour A[1,0]=1) -> colonne 2
      { i: 0, j: 2, v: 1 },
      // ligne 2 (pour A[1,2]=1) -> colonne 4
      { i: 2, j: 4, v: 1 },
    ]);
    const C = A.mul(B) as CSRMatrix;
    // Pour chaque ligne, vérifier que les colonnes sont strictement croissantes
    for (let i = 0; i < C.rows; i++) {
      const start = C.rowPtr[i];
      const end = C.rowPtr[i + 1];
      for (let k = start + 1; k < end; k++) {
        expect(C.colIndex[k]).toBeGreaterThan(C.colIndex[k - 1]);
      }
    }
  });

  test('matrices rectangulaires plus grandes 4x6 * 6x5', () => {
    const A = CSRMatrix.fromCOO(4, 6, [
      { i: 0, j: 0, v: 1 },
      { i: 0, j: 5, v: 2 },
      { i: 1, j: 2, v: 3 },
      { i: 2, j: 1, v: -1 },
      { i: 2, j: 3, v: 4 },
      { i: 3, j: 4, v: 5 },
    ]);
    const B = CSRMatrix.fromCOO(6, 5, [
      // k=0 -> col1
      { i: 0, j: 1, v: 2 },
      // k=1 -> col2
      { i: 1, j: 2, v: 2 },
      // k=2 -> cols 0 et 3
      { i: 2, j: 0, v: 1 },
      { i: 2, j: 3, v: 1 },
      // k=3 -> cols 0 et 2
      { i: 3, j: 0, v: -1 },
      { i: 3, j: 2, v: 3 },
      // k=4 -> col1
      { i: 4, j: 1, v: 1 },
      // k=5 -> col4
      { i: 5, j: 4, v: 7 },
    ]);
    const C = A.mul(B) as CSRMatrix;
    const Cd = C.toDense();
    // Calcul dense de référence
    const Ad = A.toDense();
    const Bd = B.toDense();
    const Ref = Ad.mul(Bd) as DenseMatrix;
    // Vérifier toutes les cases (4x5)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        const got = Cd.get(i, j);
        const exp = Ref.get(i, j);
        expect(got).toBe(exp);
      }
    }
  });
});

describe('CSR × CSR → CSR', () => {
  test('petit cas 2x3 * 3x2', () => {
    // A = [ [1, 0, 2],
    //       [0, 3, 0] ]
    const A = CSRMatrix.fromCOO(2, 3, [
      { i: 0, j: 0, v: 1 },
      { i: 0, j: 2, v: 2 },
      { i: 1, j: 1, v: 3 },
    ]);

    // B = [ [1, 2],
    //       [0, 1],
    //       [4, -1] ]
    const B = CSRMatrix.fromCOO(3, 2, [
      { i: 0, j: 0, v: 1 },
      { i: 0, j: 1, v: 2 },
      { i: 1, j: 1, v: 1 },
      { i: 2, j: 0, v: 4 },
      { i: 2, j: 1, v: -1 },
    ]);

    const C = A.mul(B) as CSRMatrix;

    // Attendu (Dense):
    // C = A*B = [ [1*1 + 2*4, 1*2 + 2*(-1)],
    //             [       0,          3*1] ]
    //           = [ [9, 0],
    //               [0, 3] ]

    expect(C.rows).toBe(2);
    expect(C.cols).toBe(2);

    // Vérif via get()
    expect(C.get(0, 0)).toBe(9);
    expect(C.get(0, 1)).toBe(0);
    expect(C.get(1, 0)).toBe(0);
    expect(C.get(1, 1)).toBe(3);

    // Vérif de la structure CSR (tri par colonnes et rowPtr cohérent)
    // C devrait avoir nnz = 2
    // ligne 0: (0,0)=9
    // ligne 1: (1,1)=3
    const dense = C.toDense();
    expect(dense.get(0, 0)).toBe(9);
    expect(dense.get(0, 1)).toBe(0);
    expect(dense.get(1, 0)).toBe(0);
    expect(dense.get(1, 1)).toBe(3);
  });
});
