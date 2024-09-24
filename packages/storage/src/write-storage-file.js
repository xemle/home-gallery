import path from 'path';

import { writeSafe } from '@home-gallery/common';
import { getMetaKeyName } from './meta-file-key.js';

export function writeStorageFile(entry, storageDir, filename, data, cb) {
  writeSafe(path.join(storageDir, filename), data, (err) => {
    if (err) {
      return cb(err);
    }
    // Add new file to entry
    entry.files.push(filename);
    // For json files add their content to meta data
    if (filename.match(/\.json$/)) {
      const key = getMetaKeyName(filename);
      entry.meta[key] = JSON.parse(data);
    }
    cb();
  })

}
