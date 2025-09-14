const dot = (A: number[], aRows: number, aCols: number, B: number[], bCols: number): number[] => {
  const out = new Array(aRows * bCols).fill(0);
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      for (let k = 0; k < aCols; k++) {
        out[i * bCols + j] += A[i * aCols + k] * B[k * bCols + j];
      }
    }
  }
  return out;
};

const eldiv = (A: number[], B: number[]): number[] => {
  return A.map((v, i) => (B[i] === 0 ? 0 : v / B[i]));
};

const transpose = (A: number[], rows: number, cols: number): number[] => {
  const out = new Array(cols * rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      out[j * rows + i] = A[i * cols + j];
    }
  }
  return out;
};

export { dot, eldiv, transpose };
