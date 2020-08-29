const path = require('path');
const through2 = require('through2');
const Vibrant = require('node-vibrant');
const debug = require('debug')('extract:vibrant');

const { getStoragePaths, writeStorageFile } = require('@home-gallery/storage');
const { toPipe, conditionalTask } = require('./task');

function extractVibrantColors(storageDir, entry, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const vibrantFilename = path.join(dir, `${prefix}-vibrant.json`);
  const imagePreview = path.join(dir, `${prefix}-image-preview-128.jpg`);

  if (entry.files.indexOf(vibrantFilename) >= 0) {
    return cb();
  } else if (entry.files.indexOf(imagePreview) < 0) {
    return cb(new Error(`Image preview ${imagePreview} is missing from ${entry}`))
  }

  const t0 = Date.now();
  Vibrant
    .from(path.join(storageDir, imagePreview))
    .getPalette((err, palette) => {
      if (err) {
        return cb(err);
      }
      writeStorageFile(entry, storageDir, vibrantFilename, JSON.stringify(palette), (err) => {
        if (err) {
          return cb(err);
        }
        debug(`Extracted vibrant colors from ${entry} in ${Date.now() - t0}ms`);
        cb();
      })
    });
}

function vibrantColors(storageDir) {
  const test = entry => entry.type === 'image' || entry.type === 'video';

  const task = (entry, cb) => {
    extractVibrantColors(storageDir, entry, (err) => {
      if (err) {
        debug(`Could not extract vibrant colors of ${entry}: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = vibrantColors;
