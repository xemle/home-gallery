const path = require('path');
const through2 = require('through2');
const sharp = require('sharp');
const debug = require('debug')('preview');

const getStoragePaths = require('./storage-path');
const writeEntryFile = require('./write-entry-file');

function resize(entry, src, storageDir, filename, size, cb) {
  const t0 = Date.now();
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
        debug(`Created preview ${filename} from ${entry.filename} with size ${size} in ${Date.now() - t0}ms`);
        cb(null, filename);
      });
    });
}

function resizeImage(storageDir, entry, src, sizes, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);

  let index = 0;

  const next = () => {
    if (index === sizes.length) {
      return cb(null, entry);
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
      resizeImage(storageDir, entry, entry.src, sizes, (err) => {
        if (err) {
          debug(`Could not calculate preview of ${entry.filename}: ${err}`);
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