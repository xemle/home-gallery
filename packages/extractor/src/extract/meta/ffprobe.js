const ffprobe = require('ffprobe');

const log = require('@home-gallery/logger')('extractor.video.ffprobe');

const { getNativeCommand } = require('../utils/native-command')
const { toPipe, conditionalTask } = require('../../stream/task');

const ffprobeSuffix = 'ffprobe.json';

function videoMeta(storage, extractor) {
  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, ffprobeSuffix);

  const task = (entry, cb) => {
    const t0 = Date.now();
    ffprobe(entry.src, { path: extractor.ffprobePath }, function (err, info) {
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