const ExifTool = require('exiftool-vendored').ExifTool;

const log = require('@home-gallery/logger')('extractor.image.exif');

const { toPipe, conditionalTask } = require('./task');

const exifSuffix = 'exif.json';

function exif(storage) {
  const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });

  const test = entry => ['image', 'rawImage', 'video'].indexOf(entry.type) >= 0 && !storage.hasEntryFile(entry, exifSuffix)

  const task = (entry, cb) => {
    const src = entry.src;

    const t0 = Date.now();
    exiftool.read(src)
      .then(tags => {
        storage.writeEntryFile(entry, exifSuffix, JSON.stringify(tags), (err) => {
          if (err) {
            return cb(err);
          }
          log.info(t0, `Extracted exif data from ${entry}`);
          cb();
        })
      })
      .catch(err => {
        log.warn(`Could not extract exif of ${entry}: ${err}`);
        cb();
      })
  }

  return toPipe(conditionalTask(test, task), cb => {
    exiftool.end()
      .then(cb)
      .catch(err => {
        log.warn(`Could not close exiftool: ${err}`);
        cb();
      })
  })

}

module.exports = exif;