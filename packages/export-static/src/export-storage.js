import fs from 'fs';
import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('export.storage');

import { copyFile } from './copy-file.js';

const exportEntry = (entry, storageDir, directory, cb) => {
  let i = 0;
  const previews = entry.previews || [];
  const next = () => {
    if (i === previews.length) {
      return cb();
    }
    const filename = previews[i++];
    copyFile(filename, storageDir, directory, (err) => {
      if (err) {
        log.error(`Could not export preview file ${filename} of entry ${entryToString(entry)}. Continue`);
      }
      next();
    })
  }

  next();
}

const leadPad = (value, char, len) => {
  let s = `${value}`;
  while (s.length < len) {
    s = char + s;
  }
  return s;
}

const formatDate = () => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    leadPad(now.getMonth(), '0', 2),
    leadPad(now.getDay(), '0', 2)
  ].join('')
  const time = [
    leadPad(now.getHours(), '0', 2),
    leadPad(now.getMinutes(), '0', 2),
    leadPad(now.getSeconds(), '0', 2)
  ].join('')
  return `${date}-${time}`
}

const entryToString = entry => {
  const firstFile = entry.files[0];
  return `${entry.id.substr(7)}:${firstFile.indexName}:${firstFile.filename}`
}

export const exportStorage = (database, storageDir, dir, basePath, cb) => {
  if (!dir) {
    const date = formatDate();
    dir = `home-gallery-export-${date}`
  }

  const filesDir = path.join(dir, basePath, 'files');
  const t0 = Date.now();
  const entries = database.data;
  let i = 0;
  const next = () => {
    if (i === entries.length) {
      log.info(t0, `Exported ${entries.length} entries`);
      return cb(null, database, dir, basePath);
    }

    const entry = entries[i++];
    exportEntry(entry, storageDir, filesDir, () => {
      if (i % 200 === 0) {
        process.nextTick(next);
      } else {
        next();
      }
    })

  }

  next();
}
