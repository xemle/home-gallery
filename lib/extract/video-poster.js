const path = require('path');
const through2 = require('through2');
const debug = require('debug')('extract:video:poster');

const getStoragePaths = require('./storage-path');
const { resizeImage } = require('./image-preview');
const { extractVideoFames } = require('./video-frames');

function videoPoster(storageDir, previewImageSizes) {

  function extractPoster(entry, cb) {
    const src = entry.src;
  
    const {dir, prefix} = getStoragePaths(entry.sha1sum);
    const filename = path.join(dir, `${prefix}-video-poster.jpg`);
  
    if (entry.files.indexOf(filename) >= 0) {
      return cb();
    }

    const t0 = Date.now();
    extractVideoFames(entry, src, storageDir, 1, `${prefix}-video-poster.jpg`, (err) => {
      if (err) {
        return cb(err);
      }

      resizeImage(storageDir, entry, path.join(storageDir, filename), previewImageSizes, (err, calculatedSizes) => {
        if (!err && calculatedSizes.length) {
          debug(`Created ${calculatedSizes.length} video preview images from ${entry} with sizes of ${calculatedSizes.join(',')} in ${Date.now() - t0}ms`);
        }
        cb(err);
      });

    })
  }

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'video') {
      extractPoster(entry, (err) => {
        if (err) {
          debug(`Could not extract video poster from ${entry.filename}:${entry.sha1sum}: ${err}`);
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

module.exports = videoPoster;