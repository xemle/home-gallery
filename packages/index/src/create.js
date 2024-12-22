import path from 'path';

import Logger from '@home-gallery/logger'
import { promisify } from '@home-gallery/common';

const log = Logger('index.create');

import { walkDir } from './walker.js';

/**
 * @typedef {import('./types.d').IIndex} IIndex
 */
/**
 * @typedef {import('./types.d').IIndexEntry} IIndexEntry
 */
/**
 * @typedef {import('./types.d').IIndexOptions} IIndexOptions
 */
/** @type {(dir: string, cb: any) => Promise<IIndexEntry[]>} */
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

/**
 * @param {string} dir
 * @param {import('./types.d').IIndexOptions} options
 * @returns {Promise<IIndex>}
 */
export const createIndex = async (dir, options) => {
  /** @type {IIndexEntry[]} */
  const entries = [];
  const t0 = Date.now();
  return asyncWalkDir(dir, createFilesMapper(options.excludeIfPresent), (filename, stat) => {
    const relativeFilename = path.relative(dir, filename);
    if (!options.filter(relativeFilename, stat)) {
      return false;
    }
    entries.push(Object.assign({}, stat, {
      filename: relativeFilename,
      sha1sum: '',
      sha1sumDate: null,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymbolicLink: stat.isSymbolicLink(),
      isOther: !stat.isFile() && !stat.isDirectory() && !stat.isSymbolicLink(),
      fileType: stat.isDirectory() ? 'd' : (stat.isFile() ? 'f' : (stat.isSymbolicLink() ? 'l' : 'o'))
    }));
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
