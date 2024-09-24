import Logger from '@home-gallery/logger'

const log = Logger('extractor.cache.updateEntryFiles');

import { toPipe } from './task.js';

export const updateEntryFilesCache = (storage) => {

  const task = (entries, cb) => {
    storage.updateEntryFilesCache(entries, (err) => {
      if (err) {
        log.warn(`Could not write entry files cache: ${err}`)
      }
      cb();
    })
  }

  return toPipe(task);
}
