import fs from 'fs';

import { writeJsonGzip } from '@home-gallery/common';

import { byDirDescFileAsc } from './utils.js';

export const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  index.data.sort(byDirDescFileAsc);
  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, index, err => {
    if (err) {
      cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : index));
  });
}
