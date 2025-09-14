/**
 * Forme d'une matrice: nombre de lignes et de colonnes.
 *
 * - rows: nombre de lignes (≥ 0)
 * - cols: nombre de colonnes (≥ 0)
 */
export type Shape = {
  rows: number;
  cols: number;
};

/**
 * Interface commune aux implémentations de matrices.
 *
 * Notes d’implémentation:
 * - Les opérations entre matrices peuvent retourner une DenseMatrix par défaut
 *   si le type de sortie économe n'est pas explicitement optimisé (ex: CSR + CSR -> CSR).
 * - Les classes concrètes devraient préserver autant que possible le type quand c’est pertinent.
 */
export interface IMatrix {
  readonly rows: number;
  readonly cols: number;

  /**
   * Retourne la valeur A[i,j]. Peut être 0 si l’élément n’est pas stocké (sparse).
   * @param i Ligne (0 ≤ i < rows)
   * @param j Colonne (0 ≤ j < cols)
   */
  get(i: number, j: number): number;
  /**
   * Affecte la valeur A[i,j]. Pour certaines structures creuses, peut être coûteux.
   * @param i Ligne (0 ≤ i < rows)
   * @param j Colonne (0 ≤ j < cols)
   * @param value Nouvelle valeur
   */
  set(i: number, j: number, value: number): void;

  /**
   * Addition matricielle. Doit avoir des dimensions compatibles.
   * @param B Matrice de même dimensions
   * @returns Une matrice (type spécifique selon l’implémentation)
   */
  add(B: IMatrix): IMatrix;

  /**
   * Soustraction matricielle. Doit avoir des dimensions compatibles.
   * @param B Matrice de même dimensions
   * @returns Une matrice (type spécifique selon l’implémentation)
   */
  sub(B: IMatrix): IMatrix;

  /**
   * Multiplication par scalaire ou produit matriciel (A * B).
   * - Si `B` est un nombre, renvoie une matrice du même type quand c'est possible.
   * - Si `B` est une matrice, renvoie généralement une DenseMatrix pour la compatibilité.
   * @param B Scalaire ou matrice
   * @returns Matrice résultat (type spécifique selon l’implémentation)
   */
  mul(B: number | IMatrix): IMatrix;

  /**
   * Transposition de la matrice.
   * @returns Matrice transposée
   */
  transpose(): IMatrix;

  /**
   * Produit matrice-vecteur. La taille du vecteur doit être égale à cols.
   * @param x Vecteur de longueur `cols`
   * @returns y = A x de longueur `rows`
   */
  matvec(x: Float64Array): Float64Array;

  /**
   * Convertit vers une matrice dense équivalente.
   * @returns Une matrice dense (copie des données)
   */
  toDense(): IMatrix;
}
