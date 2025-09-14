/**
 * Forme d'une matrice: nombre de lignes et de colonnes.
 */
export type Shape = {
  rows: number;
  cols: number;
};

/**
 * Interface commune aux implémentations de matrices.
 * Les opérations entre matrices peuvent retourner un DenseMatrix par défaut
 * si le type de sortie économe n'est pas explicitement optimisé (ex: CSR + CSR -> CSR).
 */
export interface IMatrix {
  readonly rows: number;
  readonly cols: number;

  get(i: number, j: number): number;
  set(i: number, j: number, value: number): void;

  /**
   * Addition matricielle. Doit avoir des dimensions compatibles.
   */
  add(B: IMatrix): IMatrix;

  /**
   * Soustraction matricielle. Doit avoir des dimensions compatibles.
   */
  sub(B: IMatrix): IMatrix;

  /**
   * Multiplication par scalaire ou produit matriciel (A * B).
   * - Si `B` est un nombre, renvoie une matrice du même type quand c'est possible.
   * - Si `B` est une matrice, renvoie généralement une DenseMatrix pour la compatibilité.
   */
  mul(B: number | IMatrix): IMatrix;

  /**
   * Transposition de la matrice.
   */
  transpose(): IMatrix;

  /**
   * Produit matrice-vecteur. La taille du vecteur doit être égale à cols.
   */
  matvec(x: Float64Array): Float64Array;

  /**
   * Convertit vers une matrice dense équivalente.
   */
  toDense(): IMatrix;
}
