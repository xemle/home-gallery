const path = require('path');
const through2 = require('through2');
const phash = require('sharp-phash');
const debug = require('debug')('extract:phash');

const getStoragePaths = require('../storage/storage-path');
const writeEntryFile = require('../storage/write-storage-file');

const phashSuffix = 'phash.json';

function calculatePHash(storageDir, entry, previewImageSuffix, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const imageFilename = path.join(storageDir, getEntryFile(entry, previewImageSuffix));
  const phashFilename = path.join(dir, `${prefix}-${phashSuffix}`);

  phash(imageFilename)
    .then((result) => {
      let high, low;
      try {
        high = parseInt(result.substr(0, 32), 2);
        low = parseInt(result.substr(32), 2);
      } catch(e) {
        return cb(`Could not convert result ${result}: ${e}`);
      }
      writeEntryFile(entry, storageDir, phashFilename, JSON.stringify({high, low, raw: result}), cb);
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
      calculatePHash(storageDir, entry, previewImageSuffix, (err) => {
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
