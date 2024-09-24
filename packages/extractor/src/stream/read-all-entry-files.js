import Logger from '@home-gallery/logger'

const log = Logger('extractor.readAllEntryFiles');

import { toPipe } from './task.js';

export const readAllEntryFiles = (storage) => {
  const task = (entry, cb) => {
    storage.readAllEntryFiles(entry, (err, {files, meta}) => {
      if (err) {
        log.warn(`Could not read all entry files of ${entry}: ${err}`);
        return cb();
      }
      entry.files = files;
      entry.meta = meta;
      cb();
    })
  }

  return toPipe(task);
}
