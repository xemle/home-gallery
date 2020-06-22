const expect = require('chai').expect;

const initDct2d = require('./index');

const simplePrecision = A => A.map(v => +(v).toFixed(2));

describe('dct2d size 8', () => {

  it('should calculate the dct', () => {
    const dct8 = initDct2d(8);
    const A = new Array(8 * 8);
    A.fill(42);

    const B = simplePrecision(dct8.dct2d(A));
    expect(B[0]).to.equal(336);

    const sum = B.reduce((r, v) => r + v);
    expect(sum).to.equal(336);
  })

  it('should calculate the inverse dct', () => {
    const dct8 = initDct2d(8);
    const A = new Array(8 * 8);
    A.fill(0);
    A[0] = 336;

    const expected = new Array(8 * 8);
    expected.fill(42);

    const B = simplePrecision(dct8.idct2d(A));
    expect(B).to.deep.equal(expected);
  })
})
