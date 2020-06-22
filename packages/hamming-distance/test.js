const expect = require('chai').expect;

const hammingDistance = require('./index.js');

describe('hammingDistance', () => {
  it('should return 4', () => {
    expect(hammingDistance('f', '0')).to.equal(4);
  });

  it('should count all bit toggle', () => {
    expect(hammingDistance('8da95aea66452c91', '7188cfa06c3f0e9b')).to.equal(26);
  });

  it('should only count max toggles', () => {
    expect(hammingDistance('8da95aea66452c91', '7188cfa06c3f0e9b', 12)).to.equal(12);
  });

  it('should not support different length', () => {
    expect(() => hammingDistance('a', 'ab')).to.throw();
  });

  it('should throw error on invalid codes', () => {
    expect(() => hammingDistance('/', '0')).to.throw();
    expect(() => hammingDistance(':', '0')).to.throw();
    expect(() => hammingDistance('@', '0')).to.throw();
    expect(() => hammingDistance('G', '0')).to.throw();
    expect(() => hammingDistance('`', '0')).to.throw();
    expect(() => hammingDistance('g', '0')).to.throw();
  })

});
