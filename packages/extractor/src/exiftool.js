const path = require('path');
const through2 = require('through2');
const ExifTool = require('exiftool-vendored').ExifTool;
const debug = require('debug')('extract:exif');

const { getStoragePaths, writeStorageFile } = require('@home-gallery/storage');
const { toPipe, conditionalTask } = require('./task');

function exif(storageDir) {
  const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });

  function extractExif(storageDir, entry, cb) {
    const src = entry.src;

    const {dir, prefix} = getStoragePaths(entry.sha1sum);
    const exifFilename = path.join(dir, `${prefix}-exif.json`);

    if (entry.files.indexOf(exifFilename) >= 0) {
      cb();
    } else {
      const t0 = Date.now();
      exiftool.read(src)
        .then(tags => {
          writeStorageFile(entry, storageDir, exifFilename, JSON.stringify(tags), (err) => {
            if (err) {
              return cb(err);
            }
            debug(`Extracted exif data from ${entry} in ${Date.now() - t0}ms`);
            cb();
          })
        })
        .catch(err => {
          cb(err);
        })
    }
  }

  const test = entry => entry.type === 'image' || entry.type === 'rawImage' || entry.type === 'video'

  const task = (entry, cb) => {
    extractExif(storageDir, entry, err => {
      if (err) {
        debug(`Could not extract exif of ${entry}: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task), cb => {
    exiftool.end()
      .then(cb)
      .catch(err => {
        debug(`Could not close exiftool: ${err}`);
        cb();
      })
  })

}

module.exports = exif;