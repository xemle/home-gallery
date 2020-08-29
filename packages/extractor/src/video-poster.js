const debug = require('debug')('extract:video:poster');

const { resizeImage } = require('./image-preview');
const { extractVideoFames } = require('./video-frames');
const { toPipe, conditionalTask } = require('./task');

const videoPosterSuffix = 'video-poster.jpg';

function videoPoster(storage, previewImageSizes) {

  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoPosterSuffix);

  const task = (entry, cb) => {
    const t0 = Date.now();
    const dir = storage.getEntryDirname(entry);
    const basename = storage.getEntryBasename(entry, videoPosterSuffix);
    extractVideoFames(entry.src, dir, basename, 1, (err) => {
      if (err) {
        return cb(err);
      }

      const posterSrc = storage.getEntryFilename(entry, videoPosterSuffix);
      resizeImage(storage, entry, posterSrc, previewImageSizes, (err, calculatedSizes) => {
        if (!err && calculatedSizes.length) {
          debug(`Created ${calculatedSizes.length} video preview images from ${entry} with sizes of ${calculatedSizes.join(',')} in ${Date.now() - t0}ms`);
        }
        cb(err);
      });

    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = videoPoster;
