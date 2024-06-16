import Vibrant from 'node-vibrant';

import Logger from '@home-gallery/logger'

const log = Logger('extractor.vibrant');

import { toPipe, conditionalTask } from '../../stream/task.js';

const vibrantSuffix = 'vibrant.json';

export function vibrant(storage, extractor) {
  const { imagePreviewSizes } = extractor
  const imageSize = imagePreviewSizes.filter(size => size <= 256).shift()
  if (!imageSize) {
    log.warn(`Could not find preview image size (<= 256) for vibrant image from preview sizes ${imagePreviewSizes}. Disable vibrant color extraction`)
  }
  const imageSuffix = `image-preview-${imageSize || 128}.jpg`;

  const test = entry => imageSize > 0 && storage.hasEntryFile(entry, imageSuffix) && !storage.hasEntryFile(entry, vibrantSuffix)

  const task = (entry, cb) => {
    const t0 = Date.now();
    Vibrant
      .from(storage.getEntryFilename(entry, imageSuffix))
      .getPalette((err, palette) => {
        if (err) {
          log.error(err, `Could not extract vibrant colors of ${entry}: ${err}`);
          return cb();
        }
        storage.writeEntryFile(entry, vibrantSuffix, JSON.stringify(palette), (err) => {
          if (err) {
            log.warn(err, `Could not write vibrant colors of ${entry}: ${err}`);
          } else {
            log.debug(t0, `Extracted vibrant colors from ${entry}`);
          }
          cb();
        })
      });
  }

  return toPipe(conditionalTask(test, task));
}
