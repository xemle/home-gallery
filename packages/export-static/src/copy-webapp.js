const path = require('path');
const glob = require('glob');

const log = require('@home-gallery/logger')('export.copy.webapp');
const { forEach } = require('@home-gallery/common');

const copyFile = require('./copy-file');

const copyWebapp = (database, outputDirectory, basePath, cb) => {
  const t0 = Date.now();
  const srcDir = path.resolve(__dirname, 'public');
  const dstDir = path.join(outputDirectory, basePath)
  glob('**/*', {
    cwd: srcDir,
    dot: true
  }, (err, files) => {
    if (err) {
      log.error(err, `Could not collect webapp sources of ${srcDir}: ${err}`);
      return cb(err);
    }
    forEach(files, (filename, cb) => copyFile(filename, srcDir, dstDir, cb), (err) => {
      if (err) {
        log.error(err, `Could not copy webapp sources to ${dstDir}: ${err}`)
        return cb(err);
      }
      log.info(t0, `Copied webapp sources to ${dstDir}`);
      cb(null, database, outputDirectory, basePath);
    })
  })
}

module.exports = copyWebapp;
