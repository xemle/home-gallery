const sharp = require('sharp');
const debug = require('debug')('extract:preview');
const tmp = require('tmp-promise');
const ExifTool = require('exiftool-vendored').ExifTool;

const { toPipe, conditionalTask } = require('./task');

function resize(src, size, cb) {
  sharp(src)
    .rotate()
    .resize({width: size})
    .jpeg({quality: 80, chromaSubsampling: '4:4:4'})
    .toBuffer(cb);
}

function resizeImage(storage, entry, src, sizes, exiftool, cb) {
  let calculatedSizes = [];
  let index = 0;
  const next = () => {
    if (index === sizes.length) {
      return cb(null, calculatedSizes);
    }

    const size = sizes[index++];
    const suffix = `image-preview-${size}.jpg`;

    if (storage.hasEntryFile(entry, suffix)) {
      src = storage.getEntryFilename(entry, suffix);
      return next();
    }

    resize(src, size, (err, buf) => {
      if (err) {
        return cb(new Error(`Could not calculate image preview from ${src} with size ${size}: ${err}`));
      }
      storage.writeEntryFile(entry, suffix, buf, (err) => {
        if (err) {
          return cb(new Error(`Could write image preview ${suffix} of ${entry}: ${err}`));
        }
        calculatedSizes.push(size);
        src = storage.getEntryFilename(entry, suffix);
        return next();
      });
    });
  }

  next();
}

function extractImageFromRaw(entry, src, exiftool, cb) {
  if (entry.type === 'rawImage') {
    tmp.tmpName().then(tmpPath => {
      exiftool.extractJpgFromRaw(src, tmpPath)
        .then(() => {cb(tmpPath);})
        .catch(err => {
          exiftool.extractPreview(src, tmpPath)
            .then(() => {cb(tmpPath);})
            .catch(err2 => {
              exiftool.extractThumbnail(src, tmpPath)
                .then(() => {cb(tmpPath);})
                .catch(err3 => {
                  debug(`Could not extract image from raw file ${entry}`);
                  cb(null);
                });
            });
        });
    });
  } else {
      cb(null);
  }
}

function imagePreview(storage, sizes) {
  const test = entry => entry.type === 'image' || entry.type === 'rawImage';
  const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });

  const task = (entry, cb) => {
    const t0 = Date.now();
    extractImageFromRaw(entry, entry.src, exiftool, (extractedImagePath) => {
      resizeImage(storage, entry, (extractedImagePath === null ? entry.src : extractedImagePath), sizes, exiftool, (err, calculatedSizes) => {
        if (err) {
          debug(`Could not calculate image preview of ${entry}: ${err}`);
        } else if (calculatedSizes.length) {
          debug(`Created ${calculatedSizes.length} image previews from ${entry} with sizes of ${calculatedSizes.join(',')} in ${Date.now() - t0}ms`)
        }
        cb();
      })
    });
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

module.exports = { imagePreview, resizeImage };
