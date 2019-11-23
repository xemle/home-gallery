const path = require('path');
const through2 = require('through2');
const hbjs = require('handbrake-js');
const debug = require('debug')('video');

const getStoragePaths = require('./storage-path');

function convertVideo(storageDir, entry, cb) {
  const input = entry.src;

  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const filename = path.join(dir, `${prefix}-video-preview-720.mp4`);

  const output = path.join(storageDir, dir, filename);

  if (entry.files.indexOf(filename) >= 0) {
    return cb();
  }

  const t0 = Date.now();
  let done = false;

  const doneHandler = (err) => {
    if (done) {
      return;
    }
    done = true;
    if (err) {
      debug(`Could not convert video ${entry.filename}: ${err}. Continue.`);
      cb();
    }
  }

  debug(`Starting video conversion of ${entry.filename}`);
  hbjs.spawn({
    input,
    output,
    preset: 'Universal',
  })
  .on('end', () => {
    if (!done) {
      done = true;
      // add new storage file
      entry.files.push(filename);
      debug(`Converted video from ${entry.filename} to ${filename} and took ${Date.now() - t0}ms`);
      cb();
    }
  })
  .on('err', doneHandler)
  .on('error', doneHandler)
  .on('complete', doneHandler)
  .on('cancel', doneHandler)
}

function video(storageDir) {

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'video') {
      convertVideo(storageDir, entry, (err) => {
        if (err) {
          debug(`Could not extract exif of ${entry.filename}: ${err}`);
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

module.exports = video;
