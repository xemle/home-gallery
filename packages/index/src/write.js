import fs from 'fs/promises';

import { writeJsonGzip, promisify } from '@home-gallery/common';

import { byDirDescFileAsc } from './utils.js';

const asyncWriteJsonGzip = promisify(writeJsonGzip)

export const writeIndex = (filename, index) => {
  index.created = new Date().toISOString();
  index.data.sort(byDirDescFileAsc);
  const tmp = `${filename}.tmp`;
  return asyncWriteJsonGzip(tmp, index)
    .then(() => {
      return fs.rename(tmp, filename)
    })
    .then(() => {
      return index
    })
}
