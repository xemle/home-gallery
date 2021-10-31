const ffprobe = require('ffprobe');

const log = require('@home-gallery/logger')('extractor.video.ffprobe');

const { getNativeCommand } = require('./utils')
const { toPipe, conditionalTask } = require('./task');

const ffprobeSuffix = 'ffprobe.json';

const getFfprobePath = useNative => {
  if (useNative.includes('ffprobe')) {
    log.debug('Use native system command ffprobe')
    return getNativeCommand('ffprobe')
  } else {
    return require('@ffprobe-installer/ffprobe').path
  }
}

function videoMeta(storage, options) {
  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, ffprobeSuffix);

  const ffprobePath = getFfprobePath(options.useNative)

  const task = (entry, cb) => {
    const t0 = Date.now();
    ffprobe(entry.src, { path: ffprobePath }, function (err, info) {
      if (err) {
        log.warn(err, `Could not extract video meta data from ${entry}: ${err}`);
        return cb();
      }

      storage.writeEntryFile(entry, ffprobeSuffix, JSON.stringify(info), (err) => {
        if (err) {
          log.warn(err, `Could not write video meta data from ${entry}: ${err}`);
          return cb();
        }
        log.debug(t0, `Extracted video meta data from ${entry}`);
        cb();
      })
    });
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = videoMeta;