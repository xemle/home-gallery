const log = require('@home-gallery/logger')('extractor.image.preview');

const rawPreviewSuffix = 'raw-preview.jpg'

const { toPipe, conditionalTask } = require('../../stream/task');

const fileExtension = filename => {
  const pos = filename.lastIndexOf('.')
  return pos > 0 ? filename.slice(pos + 1).toLowerCase() : ''
}

const isSupportedImage = entry => fileExtension(entry.filename).match(/(jpe?g|jpe|png|tiff?|gif|thm|webp)/)

const sizeToImagePreviewSuffix = size => `image-preview-${size}.jpg`

function resizeImage(storage, imageResizer, entry, src, previewSizes, cb) {
  let calculatedSizes = [];

  let index = 0;
  const next = () => {
    if (index === previewSizes.length) {
      return cb(null, calculatedSizes);
    }

    const size = previewSizes[index++];
    const suffix = sizeToImagePreviewSuffix(size);

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

const getMaxImageSizeBy = exif => {
  if (exif && exif.ImageWidth && exif.ImageHeight) {
    return Math.max(exif.ImageWidth, exif.ImageHeight)
  }
  return 0
}

function imagePreview(storage, extractor) {
  const { imageResizer, imagePreviewSizes: previewSizes } = extractor
  const defaultMaxSize = Math.max(...previewSizes)

  const test = entry => (entry.type === 'image' && isSupportedImage(entry)) || storage.hasEntryFile(entry, rawPreviewSuffix);

  const task = (entry, cb) => {
    const t0 = Date.now();

    const src = storage.hasEntryFile(entry, rawPreviewSuffix) ? storage.getEntryFilename(entry, rawPreviewSuffix) : entry.src
    const size = getMaxImageSizeBy(entry.meta.rawPreviewExif) || getMaxImageSizeBy(entry.meta.exif) || defaultMaxSize
    const resizePreviewSizes = previewSizes.filter(s => s <= size)

    resizeImage(storage, imageResizer, entry, src, resizePreviewSizes, (err, calculatedSizes) => {
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

module.exports = {
  sizeToImagePreviewSuffix,
  imagePreview,
  resizeImage
};
