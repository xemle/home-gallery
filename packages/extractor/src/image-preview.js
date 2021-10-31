const log = require('@home-gallery/logger')('extractor.image.preview');

const rawPreviewSuffix = 'raw-preview.jpg'

const { toPipe, conditionalTask } = require('./task');

const fileExtension = filename => {
  const pos = filename.lastIndexOf('.')
  return pos > 0 ? filename.slice(pos + 1).toLowerCase() : ''
}

const isSupportedImage = entry => ['jpg', 'jpeg', 'png'].includes(fileExtension(entry.filename))

function resizeImage(storage, imageResizer, entry, src, imageSizes, cb) {
  let calculatedSizes = [];

  let index = 0;
  const next = () => {
    if (index === imageSizes.length) {
      return cb(null, calculatedSizes);
    }

    const size = imageSizes[index++];
    const suffix = `image-preview-${size}.jpg`;

    const dst = storage.getEntryFilename(entry, suffix);
    if (storage.hasEntryFile(entry, suffix)) {
      src = dst;
      return next();
    }

    imageResizer(src, dst, size, err => {
      if (err) {
        return cb(new Error(`Could not calculate image preview from ${src} with size ${size}: ${err}`));
      }
      storage.addEntryFilename(entry, suffix)
      calculatedSizes.push(size);
      src = dst;
      return next();
    });
  }

  next();
}

function imagePreview(storage, { imageResizer, imagePreviewSizes }) {
  const test = entry => (entry.type === 'image' && isSupportedImage(entry)) || storage.hasEntryFile(entry, rawPreviewSuffix);

  const task = (entry, cb) => {
    const t0 = Date.now();
    const src = storage.hasEntryFile(entry, rawPreviewSuffix) ? storage.getEntryFilename(entry, rawPreviewSuffix) : entry.src
    resizeImage(storage, imageResizer, entry, src, imagePreviewSizes, (err, calculatedSizes) => {
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
