const path = require('path');
const glob = require('glob');
const debug = require('debug')('export:copy-webapp');

const copyFile = require('./copy-file');

const copyFiles = (files, srcDir, dstDir, cb) => {
  let i = 0;
  const next = () => {
    if (i === files.length) {
      return cb();
    }
    const filename = files[i++];
    copyFile(filename, srcDir, dstDir, (err) => {
      if (err) {
        const e = new Error(`Failed to copy ${filename} to ${dstDir}: ${err}`);
        e.cause = err;
        return cb(e);
      }
      next();
    })
  }
  next();
}

const copyWebapp = (outputDirectory, basePath, cb) => {
  const t0 = Date.now();
  const srcDir = path.resolve(__dirname, 'public');
  const dstDir = path.join(outputDirectory, basePath)
  glob('**/*', {
    cwd: srcDir,
    dot: true
  }, (err, files) => {
    if (err) {
      debug(`Could not copy webapp sources to ${dstDir}: ${err}`);
      return cb(err);
    }
    copyFiles(files, srcDir, dstDir, (err) => {
      if (err) {
        debug(`Could not copy webapp sources to ${dstDir}: ${err}`)
        return cb(err);
      }
      debug(`Copied webapp sources to ${dstDir} in ${Date.now() - t0}ms`);
      cb(null, outputDirectory, basePath);
    })
  })
}

module.exports = copyWebapp;
