import { dot } from '../src';

describe('dot', () => {
  it('multiplie deux matrices plates 2x2 correctement', () => {
    // A = [1, 2, 3, 4] (2x2), B = [5, 6, 7, 8] (2x2)
    // Résultat attendu : [1*5+2*7, 1*6+2*8, 3*5+4*7, 3*6+4*8] = [19, 22, 43, 50]
    const A = [1, 2, 3, 4];
    const B = [5, 6, 7, 8];
    const result = dot(A, 2, 2, B, 2);
    expect(result).toEqual([19, 22, 43, 50]);
  });

  it('multiplie deux matrices plates 2x3 et 3x2 correctement', () => {
    // A = [1,2,3,4,5,6] (2x3), B = [7,8,9,10,11,12] (3x2)
    // Résultat attendu : [1*7+2*9+3*11, 1*8+2*10+3*12, 4*7+5*9+6*11, 4*8+5*10+6*12] = [58, 64, 139, 154]
    const A = [1, 2, 3, 4, 5, 6];
    const B = [7, 8, 9, 10, 11, 12];
    const result = dot(A, 2, 3, B, 2);
    expect(result).toEqual([58, 64, 139, 154]);
  });
});
