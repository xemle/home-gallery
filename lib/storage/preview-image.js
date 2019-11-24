const path = require('path');
const through2 = require('through2');
const sharp = require('sharp');
const debug = require('debug')('preview');

const getStoragePaths = require('./storage-path');
const writeEntryFile = require('./write-entry-file');

function resize(entry, src, storageDir, filename, size, cb) {
  sharp(src)
    .rotate()
    .resize({width: size})
    .jpeg({quality: 80, chromaSubsampling: '4:4:4'})
    .toBuffer((err, buf) => {
      if (err) {
        return cb(`Could not create JPEG buffer from ${src}: ${err}`);
      }
      writeEntryFile(entry, storageDir, filename, buf, (err) => {
        if (err) {
          return cb(err);
        }
        cb(null, filename);
      });
    });
}

function resizeImage(storageDir, entry, src, sizes, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);

  let resizeCount = 0;

  let index = 0;
  const next = () => {
    if (index === sizes.length) {
      return cb(null, resizeCount);
    }

    const size = sizes[index++];
    const filename = path.join(dir, `${prefix}-preview-image-${size}.jpg`);

    if (entry.files.indexOf(filename) >= 0) {
      src = path.join(storageDir, filename);
      return next();
    }

    resize(entry, src, storageDir, filename, size, (err) => {
      if (err) {
        return cb(new Error(`Could not calculate preview from ${src} to ${filename}: ${err}`));
      } else {
        resizeCount++;
        src = path.join(storageDir, filename);
        return next();
      }
    });
  }

  next();
}

function previewImage(storageDir, sizes) {
  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'image') {
      const t0 = Date.now();
      resizeImage(storageDir, entry, entry.src, sizes, (err, resizeCount) => {
        if (err) {
          debug(`Could not calculate preview of ${entry.filename}: ${err}`);
        } else if (resizeCount) {
          debug(`Created ${resizeCount} preview images from ${entry.filename}:${entry.sha1sum} with sizes of ${sizes.join(',')} in ${Date.now() - t0}ms`)
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

module.exports = { previewImage, resizeImage };