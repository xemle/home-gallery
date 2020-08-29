const path = require('path');
const through2 = require('through2');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const debug = require('debug')('extract:ffprobe');

const { getStoragePaths, writeStorageFile } = require('@home-gallery/storage');
const { toPipe, conditionalTask } = require('./task');

function execFfprobe(storageDir, entry, cb) {
  const src = entry.src;

  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const filename = path.join(dir, `${prefix}-ffprobe.json`);

  if (entry.files.indexOf(filename) >= 0) {
    return cb();
  }

  const t0 = Date.now();
  ffprobe(src, { path: ffprobeStatic.path }, function (err, info) {
    if (err) {
      return cb(err);
    }

    writeStorageFile(entry, storageDir, filename, JSON.stringify(info), (err) => {
      if (err) {
        return cb(err);
      }
      debug(`Extracted video meta data from ${entry} in ${Date.now() - t0}ms`);
      cb();
    })
  });
}

function videoMeta(storageDir) {

  const test = entry => entry.type === 'video';

  const task = (entry, cb) => {
    execFfprobe(storageDir, entry, err => {
      if (err) {
        debug(`Could not extract video metadata of ${entry}: ${err}`);
      }
      cb();
    });
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = videoMeta;