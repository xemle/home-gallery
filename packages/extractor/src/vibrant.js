const Vibrant = require('node-vibrant');
const debug = require('debug')('extract:vibrant');

const { toPipe, conditionalTask } = require('./task');

const vibrantSuffix = 'vibrant.json';
const imageSuffix = 'image-preview-128.jpg';

function vibrantColors(storage) {
  const test = entry => {
    if (['image', 'video'].indexOf(entry.type) < 0 || storage.hasEntryFile(entry, vibrantSuffix)) {
      return false;
    } else if (!storage.hasEntryFile(entry, imageSuffix)) {
      debug(`Image preview ${imageSuffix} is missing from ${entry}`);
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
          debug(`Could not extract vibrant colors of ${entry}: ${err}`);
          return cb();
        }
        storage.writeEntryFile(entry, vibrantSuffix, JSON.stringify(palette), (err) => {
          if (err) {
            debug(`Could not write vibrant colors of ${entry}: ${err}`);
          } else {
            debug(`Extracted vibrant colors from ${entry} in ${Date.now() - t0}ms`);
          }
          cb();
        })
      });
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = vibrantColors;
