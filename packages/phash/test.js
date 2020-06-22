const expect = require('chai').expect;
const path = require('path');

const phash = require('./index');

/*
const sharp = require('sharp');
const readImage = (image) => {
  return sharp(path.resolve('img', image))
      .greyscale()
      .resize(32, 32, { fit: "fill" })
      .rotate()
      .raw()
      .toBuffer();
}
*/

const Jimp = require('jimp');
const readImage = (image) => {
  return Jimp.read(image)
    .then(img => {
      return img
        .resize(32, 32, Jimp.RESIZE_BICUBIC)
        .greyscale()
    })
    .then(img => {
      return img.bitmap.data.filter((v, i) => i % 4 === 0)
    })
}

describe('phash', () => {
  let hash;

  before(() => {
    return readImage(path.resolve('img', 'nordkapp.jpg'))
      .then(buf => phash([...buf]))
      .then(result => hash = result)
  });

  it('should calculate the phash with high and low 32 bit ints', () => {
    expect(hash.high).to.equal(992336995);
    expect(hash.low).to.equal(647325038);
  });

  it('should throw error on invalid inputs', () => {
    expect(() => phash('string')).to.throw().match(/Expect an array/);
    expect(() => phash(new Array(1023))).to.throw().match(/Expect array length of 1024/);
  });

  describe('toHex()', () => {
    it('should return hex format', () => {
      expect(hash.toHex().length).to.equal(16);
      expect(hash.toHex()).to.match(/^[0-9a-f]+$/);
      expect(hash.toHex()).to.equal('3b25dc632695656e');
    });
  });

  describe('toDec()', () => {
    it('should return dec format', () => {
      expect(hash.toDec().toString()).to.match(/^[0-9]+$/);
      expect(hash.toDec().toString()).to.equal('4262054940783240558');
    });
  });

  describe('toBin()', () => {
    it('should return binary format', () => {
      expect(hash.toBin().length).to.equal(64);
      expect(hash.toBin()).to.match(/^[01]+$/);
      expect(hash.toBin()).to.equal('0011101100100101110111000110001100100110100101010110010101101110');
    });
  });

  describe('toString()', () => {
    it('should return bin format', () => {
      expect(hash.toString().length).to.equal(hash.toBin().length);
      expect(hash.toString()).to.equal(hash.toBin());
    });
  });

});
