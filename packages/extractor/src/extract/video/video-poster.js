import Logger from '@home-gallery/logger'

const log = Logger('extractor.video.poster');

import { resizeImage } from '../image/image-preview.js';
import { toPipe, conditionalTask } from '../../stream/task.js';

const videoPosterSuffix = 'video-poster.jpg';

const getMaxVideoSize = (entry, defaultSize) => {
  return entry.meta.ffprobe?.streams
    .filter(stream => stream.codec_type == 'video' && stream.width && stream.height)
    .reduce((size, stream) => Math.max(size, stream.width, stream.height), 0)
    || defaultSize
}

export function videoPoster(storage, extractor) {
  const { imageResizer, videoFrameExtractor, imagePreviewSizes } = extractor
  const maxPreviewSize = Math.max(...imagePreviewSizes)

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
      const size = getMaxVideoSize(entry, maxPreviewSize)
      const previewSizes = imagePreviewSizes.filter(previewSize => previewSize <= size)
      resizeImage(storage, imageResizer, entry, posterSrc, previewSizes, (err, calculatedSizes) => {
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
