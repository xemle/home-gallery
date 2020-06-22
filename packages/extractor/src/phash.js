const path = require('path');
const through2 = require('through2');
const sharp = require('sharp');
const debug = require('debug')('extract:phash');

const phash = require('@home-gallery/phash');

const { getStoragePaths, writeStorageFile } = require('@home-gallery/storage');

const phashSuffix = 'phash.json';

function calculatePhash(image) {
  let sharpImage;
  try {
    sharpImage = sharp(image);
  } catch (e) {
    return Promise.reject(`Initiation of sharp failed. Error: ${e}`);
  }

  return sharpImage
    .greyscale()
    .resize(32, 32, { fit: "fill" })
    .rotate()
    .raw()
    .toBuffer()
    .then(buf => phash([...buf]))
    .then(hash => hash.toHex());
}

function createPhashFile(storageDir, entry, previewImageSuffix, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const imageFilename = path.join(storageDir, getEntryFile(entry, previewImageSuffix));
  const phashFilename = path.join(dir, `${prefix}-${phashSuffix}`);

  calculatePhash(imageFilename)
    .then(hash => {
      writeStorageFile(entry, storageDir, phashFilename, JSON.stringify(hash), cb);
    }, (err) => {
      return cb(err);
    })
    .catch(err => {
      cb(err);
    });
}

function getEntryFile(entry, needle) {
  const files = entry.files || [];
  return files.filter(f => f.indexOf(needle) >= 0).shift();
}

function entryHasFile(entry, needle) {
  return !!getEntryFile(entry, needle)
}

function phashExtractor(storageDir, previewImageSuffix) {
  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entryHasFile(entry, previewImageSuffix) && !entryHasFile(entry, phashSuffix)) {
      const t0 = Date.now();
      createPhashFile(storageDir, entry, previewImageSuffix, (err) => {
        if (err) {
          debug(`Could not calculate phash of ${entry}: ${err}`);
        } else {
          debug(`Calculated phash from ${entry} in ${Date.now() - t0}ms`);
        }
        that.push(entry);
        cb();
      })
    } else {
      this.push(entry);
      cb();
    }

  });
}

module.exports = phashExtractor;
