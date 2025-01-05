import * as fs from 'fs'
import path from 'path';

import Logger from '@home-gallery/logger'
import { promisify } from '@home-gallery/common';

const log = Logger('index.create');

import { walkDir } from './walker.js';
import { IIndexEntry, IIndexOptions, IWalkerFileHandler } from './types.js';

/** @type {(dir: string, cb: IWalkerFileHandler) => Promise<IIndexEntry[]>} */
const asyncWalkDir = promisify(walkDir)

const createFilesMapper = (excludeIfPresent) => {
  if (!excludeIfPresent) {
    return (files) => files;
  }

  const excludeDirectoryFiles = [excludeIfPresent];

  return (files) => {
    const excludeDirectory = files.indexOf(excludeIfPresent) >= 0;
    return excludeDirectory ? excludeDirectoryFiles : files;
  }
}

export async function createIndex(dir: string, options: IIndexOptions): Promise<IIndexEntry[]> {
  const entries: IIndexEntry[] = [];
  const t0 = Date.now();
  return asyncWalkDir(dir, createFilesMapper(options.excludeIfPresent), (filename: string, stat: fs.Stats) => {
    const relativeFilename = path.relative(dir, filename);
    if (options.filter && !options.filter(relativeFilename, stat)) {
      return false;
    }
    const entry: IIndexEntry  = Object.assign({}, stat, {
      created: new Date().toISOString(),
      filename: relativeFilename,
      sha1sum: '',
      sha1sumDate: null,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymbolicLink: stat.isSymbolicLink(),
      isOther: !stat.isFile() && !stat.isDirectory() && !stat.isSymbolicLink(),
      fileType: stat.isDirectory() ? 'd' : (stat.isFile() ? 'f' : (stat.isSymbolicLink() ? 'l' : 'o'))
    })
    entries.push(entry);
    return true;
  })
  .then(() => {
    log.info(t0, `Read ${entries.length} files in ${dir}`);
    return entries
  })
  .catch(err => {
    log.error(err, `Could not read files in ${dir}: ${err}`);
    throw err
  });
}
