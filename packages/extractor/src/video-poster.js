const log = require('@home-gallery/logger')('extractor.video.poster');

const { resizeImage } = require('./image-preview');
const { toPipe, conditionalTask } = require('./task');

const videoPosterSuffix = 'video-poster.jpg';

function videoPoster(storage, { imageResizer, videoFrameExtractor, imagePreviewSizes }) {

  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoPosterSuffix);

  const task = (entry, cb) => {
    const t0 = Date.now();
    const dir = storage.getEntryDirname(entry);
    const basename = storage.getEntryBasename(entry, videoPosterSuffix);
    videoFrameExtractor(entry.src, dir, basename, 1, (err) => {
      if (err) {
        log.warn(err, `Could not extract video frame from ${entry}: ${err}`)
        return cb();
      }

      const posterSrc = storage.getEntryFilename(entry, videoPosterSuffix);
      resizeImage(storage, imageResizer, entry, posterSrc, imagePreviewSizes, (err, calculatedSizes) => {
        if (err) {
          log.warn(err, `Could not resize video frame from ${entry}: ${err}`)
          return cb();
        } else if (calculatedSizes.length) {
          log.debug(t0, `Created ${calculatedSizes.length} video preview images from ${entry} with sizes of ${calculatedSizes.join(',')}`);
        }
        cb();
      });

    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = videoPoster;
