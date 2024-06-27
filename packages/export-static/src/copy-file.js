import fs from 'fs';
import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('export.copy.file');
import { mkdir } from '@home-gallery/common'

const cp = (src, dst, size, cb) => {
  fs.copyFile(src, dst, (err) => {
    if (err) {
      log.error(`Copy of ${src} to ${dst} failed: ${err}`);
      return cb(err);
    }
    cb();
  })
}

const shouldOverwrite = (srcStats, dstStats) => {
  return srcStats.size != dstStats.size;
}

export const copyFile = (filename, srcDir, dstDir, cb) => {
  const src = path.join(srcDir, filename);
  const dst = path.join(dstDir, filename);
  
  fs.stat(src, (err, srcStats) => {
    if (err && err.code === 'ENOENT') {
      const e = new Error(`Source file ${src} is missing`)
      e.cause = err;
      return cb(e);
    } else if (err) {
      const e = new Error(`Could not get file stats of ${src}`)
      e.cause = err;
      return cb(e);
    }

    if (srcStats.isDirectory()) {
      log.debug(`Skip copy of directory ${src}`);
      return cb();
    }

    fs.stat(dst, (err, dstStats) => {
      if (err && err.code === 'ENOENT') {
        const dir = path.dirname(dst)
        return mkdir(dir, (err) => {
          if (err) {
            const e = new Error(`Could not create directory ${path.relative(dstDir, dir)} in ${dstDir}: ${err}`)
            e.cause = err;
            return cb(e);
          }
          cp(src, dst, srcStats.size, cb);
        })
      } else if (err) {
        const e = new Error(`File stat failed of ${filename} in ${dstDir}: ${err}`)
        e.cause = err
        return cb(e);
      }

      if (shouldOverwrite(srcStats, dstStats)) {
        log.info(`Overwrite ${filename}`);
        cp(src, dst, srcStats.size, cb);
      } else {
        cb();
      }
    })
  })
}
