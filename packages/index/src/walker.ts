import * as fs from 'fs';
import path from 'path';

import Logger from '@home-gallery/logger'
import { IWalkerFileHandler } from './types.js';

const log = Logger('index.walker');

function handleReaddirError(dir, err, done) {
  if (err.code === 'EACCES') {
    log.warn(`Read of directory ${dir} failed: Permission denied`);
    return done();
  }
  return done(err);
}

type IFilenameMapper = (files: string[]) => string[]
type IWalkerDone = (err?: Error) => void
type IFilenameStat = {
  filename: string
  stat: fs.Stats
}

function readFileStats(dir: string, files: string[], cb: (err: Error | null, fileStats?: IFilenameStat[]) => void) {
  const fileStats: IFilenameStat[] = [];
  let countDownLatch = files.length;
  let hasError = false;

  files.forEach(file => {
    if (hasError) {
      return;
    }

    const filename = path.join(dir, file);
    fs.stat(filename, (err, stat) => {
      if (hasError) {
        return;
      } else if (err) {
        hasError = true;
        log.warn(`Could not read file stat of ${filename}: ${err}`);
        return cb(err);
      }

      fileStats.push({filename, stat});

      countDownLatch--;
      if (!countDownLatch) {
        cb(null, fileStats);
      }
    })
  })
}

function walkFiles(dir: string, filesMapper: IFilenameMapper, fileStats: IFilenameStat[], cb: IWalkerFileHandler, done: IWalkerDone) {
  while (fileStats.length) {
    const { filename, stat } = fileStats.pop();

    const readDirectory = cb(filename, stat);

    if (readDirectory && stat.isDirectory()) {
      return walkDir(filename, filesMapper, cb, (err) => {
        if (err) {
          return done(err);
        }
        return walkFiles(dir, filesMapper, fileStats, cb, done);
      });
    }
  }
  return done();
}

function byDirDescNameAsc(a, b) {
  const aIsDir = a.stat.isDirectory();
  if (aIsDir === b.stat.isDirectory()) {
    const rev = aIsDir ? -1 : 1
    return a.filename < b.filename ? rev : -1 * rev;
  } else {
    return aIsDir ? 1 : -1;
  }
}

export function walkDir(dir: string, filesMapper: IFilenameMapper, cb: IWalkerFileHandler, done: IWalkerDone) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return handleReaddirError(dir, err, done);
    } else if (!files.length) {
      return done();
    }

    const mappedFiles = filesMapper(files);
    if (!mappedFiles.length) {
      return done();
    }

    readFileStats(dir, mappedFiles, (err, fileStats) => {
      if (err) {
        return done(err);
      }

      fileStats.sort(byDirDescNameAsc);
      walkFiles(dir, filesMapper, fileStats, cb, done);
    });
  })
}
