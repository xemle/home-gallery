const Vibrant = require('node-vibrant');

const log = require('@home-gallery/logger')('extractor.vibrant');

const { toPipe, conditionalTask } = require('./task');

const vibrantSuffix = 'vibrant.json';
const imageSuffix = 'image-preview-128.jpg';

function vibrantColors(storage) {
  const test = entry => {
    if (['image', 'video'].indexOf(entry.type) < 0 || storage.hasEntryFile(entry, vibrantSuffix)) {
      return false;
    } else if (!storage.hasEntryFile(entry, imageSuffix)) {
      log.warn(`Image preview ${imageSuffix} is missing from ${entry}`);
      return false;
    }
    return true;
  }

  const task = (entry, cb) => {
    const t0 = Date.now();
    Vibrant
      .from(storage.getEntryFilename(entry, imageSuffix))
      .getPalette((err, palette) => {
        if (err) {
          log.error(`Could not extract vibrant colors of ${entry}: ${err}`);
          return cb();
        }
        storage.writeEntryFile(entry, vibrantSuffix, JSON.stringify(palette), (err) => {
          if (err) {
            log.info(`Could not write vibrant colors of ${entry}: ${err}`);
          } else {
            log.info(t0, `Extracted vibrant colors from ${entry}`);
          }
          cb();
        })
      });
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = vibrantColors;
