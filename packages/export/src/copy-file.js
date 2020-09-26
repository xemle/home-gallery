const fs = require('fs');
const path = require('path');
const debug = require('debug')('export:copy');

const { mkdir } = require('@home-gallery/common')

const cp = (src, dst, size, cb) => {
  fs.copyFile(src, dst, (err) => {
    if (err) {
      debug(`Copy of ${src} to ${dst} failed: ${err}`);
      return cb(err);
    }
    cb();
  })
}

const shouldOverwrite = (srcStats, dstStats) => {
  return srcStats.size != dstStats.size;
}

const copyFile = (filename, srcDir, dstDir, cb) => {
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
        debug(`Overwrite ${filename}`);
        cp(src, dst, srcStats.size, cb);
      } else {
        cb();
      }
    })
  })
}

module.exports = copyFile;
