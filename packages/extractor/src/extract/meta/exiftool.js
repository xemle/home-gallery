const ExifTool = require('exiftool-vendored').ExifTool;

const log = require('@home-gallery/logger')('extractor.image.exif');

const { toPipe, conditionalTask } = require('../../stream/task');
const { getNativeCommand } = require('../utils/native-command')

const exifSuffix = 'exif.json';

const exifTypes = ['image', 'rawImage', 'video', 'meta']

const initExiftool = async config => {
  const exiftoolOptions = {
    taskTimeoutMillis: 5000
  }
  if (config?.extractor?.useNative?.includes('exiftool')) {
    log.debug(`Use native system command exiftool`)
    exiftoolOptions.exiftoolPath = getNativeCommand('exiftool')
  }

  return new Promise((resolve, reject) => {
    const exiftool = new ExifTool(exiftoolOptions)
    if (!exiftool) {
      return reject(new Error(`Could not initiate exiftool with options: ${JSON.stringify(exiftoolOptions)}`))
    }
    exiftool.version()
      .then(version => {
        log.debug(`Use exiftool version ${version}`)
        resolve(exiftool)
      })
      .catch(err => {
        return reject(new Error(`Failed to read exiftool version: ${err}`))
      })
   })
}

function exif(storage, {exiftool}) {
  const test = entry => exifTypes.includes(entry.type) && !storage.hasEntryFile(entry, exifSuffix)

  const task = (entry, cb) => {
    const src = entry.src;

    const t0 = Date.now();
    exiftool.read(src)
      .then(tags => {
        storage.writeEntryFile(entry, exifSuffix, JSON.stringify(tags), (err) => {
          if (err) {
            log.error(err, `Could not write exif data for ${entry}: ${err}`)
            return cb();
          }
          log.debug(t0, `Extracted exif data from ${entry}`);
          cb();
        })
      })
      .catch(err => {
        log.warn(err, `Could not extract exif of ${entry}: ${err}`);
        cb();
      })
  }

  return toPipe(conditionalTask(test, task))
}

const endExiftool = (exiftool, cb) => {
  exiftool.end()
    .then(() => {
      log.debug(`Close exiftool`)
      cb()
    })
    .catch(err => {
      log.warn(err, `Could not close exiftool: ${err}`);
      cb();
    })
}

module.exports = {
  initExiftool,
  exif,
  endExiftool
};
