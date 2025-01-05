import path from 'path';

import { writeJsonGzip, promisify } from '@home-gallery/common';

import { byDirDescFileAsc } from './utils.js';
import { IIndex, IIndexEntry, IIndexOptions } from './types.js';

const asyncWriteJsonGzip = promisify(writeJsonGzip)

export const writeIndex = async (directory: string, filename: string, entries: IIndexEntry[], options: IIndexOptions): Promise<IIndex> => {
  const index = {
    type: 'home-gallery/fileindex@1.0',
    created: new Date().toISOString(),
    base: path.resolve(directory),
    data: entries.sort(byDirDescFileAsc)
  }
  if (options.dryRun) {
    return index
  }
  return asyncWriteJsonGzip(filename, index).then(() => index)
}
