const Vibrant = require('node-vibrant');

const log = require('@home-gallery/logger')('extractor.vibrant');

const { toPipe, conditionalTask } = require('./task');

const imageSuffix = 'image-preview-128.jpg';
const vibrantSuffix = 'vibrant.json';

function vibrantColors(storage) {
  const test = entry => storage.hasEntryFile(entry, imageSuffix) && !storage.hasEntryFile(entry, vibrantSuffix)

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

module.exports = vibrantColors;
