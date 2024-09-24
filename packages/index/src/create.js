import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('index.create');

import { walkDir } from './walker.js';

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

export const createIndex = (dir, options, cb) => {
  const entries = [];
  const t0 = Date.now();
  walkDir(dir, createFilesMapper(options.excludeIfPresent), (filename, stat) => {
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
  }, (err) => {
    if (err) {
      log.error(`Could not read files in ${dir}: ${err}`);
      return cb(err);
    } 
    log.info(t0, `Read ${entries.length} files in ${dir}`);
    cb(null, entries);
  });
}
