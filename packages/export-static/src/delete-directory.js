const rimraf = require('rimraf');

const log = require('@home-gallery/logger')('export.rmdir');

const deleteDirectory = (dir, keep, archiveFile, cb) => {
  if (keep || !archiveFile || !archiveFile.length) {
    log.info(`Keep output directory ${dir}`)
    return cb(null, dir, archiveFile);
  }

  const t0 = Date.now();
  rimraf(dir, {}, (err) => {
    if (err) {
      log.error(`Could not delete ${dir}: ${err}. Continue`);
      return cb(null, null, archiveFile)
    }
    log.info(t0, `Deleted directory ${dir}`)
    return cb(null, null, archiveFile)
  })
}

module.exports = deleteDirectory;