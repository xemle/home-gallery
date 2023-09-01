const rimraf = require('rimraf');

const log = require('@home-gallery/logger')('export.rmdir');

const deleteDirectory = (outputDirectory, keep, archiveFilename, cb) => {
  if (keep || !archiveFilename || !archiveFilename.length) {
    log.info(`Keep output directory ${outputDirectory}`)
    return cb(null, outputDirectory, archiveFilename);
  }

  const t0 = Date.now();
  rimraf(outputDirectory, {}, (err) => {
    if (err) {
      log.error(`Could not delete ${outputDirectory}: ${err}. Continue`);
      return cb(null, null, archiveFilename)
    }
    log.info(t0, `Deleted directory ${outputDirectory}`)
    return cb(null, null, archiveFilename)
  })
}

module.exports = deleteDirectory;