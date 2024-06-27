import ffprobeBin from 'ffprobe';

import Logger from '@home-gallery/logger'

const log = Logger('extractor.video.ffprobe');

import { toPipe, conditionalTask } from '../../stream/task.js';

const ffprobeSuffix = 'ffprobe.json';

export function ffprobe(storage, extractor) {
  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, ffprobeSuffix);

  const task = (entry, cb) => {
    const t0 = Date.now();
    ffprobeBin(entry.src, { path: extractor.ffprobePath }, function (err, info) {
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
