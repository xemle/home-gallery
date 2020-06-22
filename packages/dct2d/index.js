/**
 * Implementation of the dct2d and idct2 algorithm
 *
 * @see https://www.mathworks.com/help/images/ref/dct2.html
 * @see https://www.mathworks.com/help/images/ref/idct2.html
 */

/**
 * Helper function to iteratate over 2 dimensional array. For each row i iterate through each column i
 *
 * @param {number} size Size of square area
 * @param {Function} cb Iteration function
 */
const forEach2d = (size, cb) => {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      cb(i, j);
    }
  }
}

/**
 * Precalculate cosinus terms to save Math.cos() calls
 *
 * @param {number} size
 * @return {Array} Precalculated cos terms
 */
const initCosTerms = (size) => {
  const result = [];
  forEach2d(size, (m, p) => {
    const cos = Math.cos((Math.PI * (2 * m + 1) * p) / (2 * size));
    result.push(cos);
  })
  return result;
}

/**
 * Initialize the dct2d/idct2d on defined size (M == N = size) and
 * returns the dct2d and idct2d function
 *
 * @param {number} size
 * @return {object} dct2d and idct2d function
 */
const initDct2d = (size) => {
  const cosTerms = initCosTerms(size);

  const iSqrt = 1 / Math.sqrt(size);
  const i2Sqrt = Math.sqrt(2 / size);

  const dct2d = (A) => {
    const B = [];
    // for all 0 <= p < M and 0 <= q < N (M = N = size)
    forEach2d(size, (p, q) => {
      // calculate ap*aq*(sum 0<=m<M (sum 0<=n<N (Amn * cos(PI(2m+1)p/2M) * cos(PI(2n+1)q/2N))))
      let sum = 0;
      forEach2d(size, (m, n) => {
        sum += A[m * size + n] * cosTerms[m * size + p] * cosTerms[n * size + q];
      })
      const ap = p === 0 ? iSqrt : i2Sqrt;
      const aq = q === 0 ? iSqrt : i2Sqrt;
      B.push(ap * aq * sum);
    })

    return B;
  }

  const idct2d = (B) => {
    const A = [];
    // for all 0 <= m < M and 0 <= n < N (M = N = size)
    forEach2d(size, (m, n) => {
      // calculate (sum 0<=p<M (sum 0<=q<N (ap*aq*Bpq * cos(PI(2m+1)p/2M) * cos(PI(2n+1)q/2N))))
      let sum = 0;
      forEach2d(size, (p, q) => {
        const ap = p === 0 ? iSqrt : i2Sqrt;
        const aq = q === 0 ? iSqrt : i2Sqrt;
        sum += ap * aq * B[p * size + q] * cosTerms[m * size + p] * cosTerms[n * size + q];
      })
      A.push(sum);
    })

    return A;
  }

  return { dct2d, idct2d };
}

module.exports = initDct2d;
