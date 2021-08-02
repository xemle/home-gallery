const log = require('@home-gallery/logger')('extractor.image.preview');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  log.error(`Could not load sharp: ${e}`)
}

const { toPipe, conditionalTask } = require('./task');

function resize(src, size, cb) {
  if (!sharp) {
    return cb(new Error(`Sharp is not loaded`))
  }

  sharp(src)
    .rotate()
    .resize({width: size})
    .jpeg({quality: 80, chromaSubsampling: '4:4:4'})
    .toBuffer(cb);
}

function resizeImage(storage, entry, src, sizes, cb) {
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

function imagePreview(storage, sizes) {
  const test = entry => entry.type === 'image';

  const task = (entry, cb) => {
    const t0 = Date.now();
    resizeImage(storage, entry, entry.src, sizes, (err, calculatedSizes) => {
      if (err) {
        log.error(`Could not calculate image preview of ${entry}: ${err}`);
      } else if (calculatedSizes.length) {
        log.info(t0, `Created ${calculatedSizes.length} image previews from ${entry} with sizes of ${calculatedSizes.join(',')}`)
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = { imagePreview, resizeImage };