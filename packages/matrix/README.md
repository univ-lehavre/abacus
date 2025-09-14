# @univ-lehavre/matrix

Une petite bibliothèque TypeScript pour le calcul matriciel dense et creux (CSR) avec un focus sur:

- Stockage efficace (Float64Array pour dense, CSR pour creux)
- Opérations de base rapides (add, sub, mul [scalaire/matriciel], transpose, matvec)
- API commune via l’interface `IMatrix`

## Installation

Ce package fait partie du monorepo. Pour travailler localement:

```bash
pnpm -w i
pnpm -w build
pnpm -C packages/matrix test
```

## Utilisation rapide

```ts
import { DenseMatrix, CSRMatrix, zeros, identity, from2D } from '@univ-lehavre/matrix';

// Dense
const A = from2D([
  [1, 2],
  [3, 4],
]);
const B = identity(2);
const C = A.mul(B); // produit matriciel Dense x Dense

// Vecteur
const x = new Float64Array([2, 1]);
const y = A.matvec(x); // -> [1*2 + 2*1, 3*2 + 4*1]

// Sparse (CSR)
const S = CSRMatrix.fromCOO(2, 3, [
  { i: 0, j: 0, v: 1 },
  { i: 0, j: 2, v: 2 },
  { i: 1, j: 1, v: 3 },
]);
const D = S.mul(A.transpose()); // CSR x Dense -> Dense
```

## API

- `DenseMatrix` (stockage row-major via `Float64Array`)
  - `get/set`, `add/sub`, `mul(number|IMatrix)`, `transpose`, `matvec`, `toDense`
  - `static from2D`, `static identity`, `static zeros`
- `CSRMatrix` (Compressed Sparse Row)
  - `fromCOO(rows, cols, entries)` et `fromDense(DenseMatrix)`
  - `get/set`, `add/sub`, `mul(number|IMatrix)` dont `CSR × CSR → CSR` optimisé (Gustavson), `transpose`, `matvec`, `toDense`
- Helpers
  - `zeros(rows, cols)`, `identity(n)`, `from2D(values)`

## Notes de perf et limites

- Les opérations mixant dense et CSR privilégient des chemins optimisés (ex: CSR \* Dense). CSR × CSR est maintenant optimisé et renvoie une CSR sans conversion intermédiaire.
- `CSRMatrix.set` reconstruit actuellement la structure; pour des mises à jour massives, préférez construire depuis un COO.
- Les calculs sont en `number` (double précision). Pas de support BigInt/complexe pour l’instant.

## Bench rapide (optionnel)

Un petit script de bench est disponible pour comparer rapidement les temps d’exécution de `CSR × CSR` et `Dense × Dense` en fonction de la taille et de la densité.

Exécution locale:

```bash
pnpm -C packages/matrix bench
```

Le script génère deux sections:

- "Bench par taille": multiplie des matrices carrées de tailles croissantes (densité ~5%).
- "Bench par densité": multiplie des matrices fixes (150×150) avec différentes densités.

Astuce: les mesures varient selon la machine et la charge. Utilisez-les pour comparer des tendances, pas comme des chiffres absolus.

## Licence

UNLICENSED (interne pour l’instant).

## Documentation API (TypeDoc)

Vous pouvez générer une documentation HTML à partir de la JSDoc via TypeDoc:

```bash
pnpm -C packages/matrix i
pnpm -C packages/matrix docs
```

La doc sera construite dans `packages/matrix/docs`. Pour la prévisualiser dans VS Code, ouvrez le fichier `index.html` dans ce dossier.
