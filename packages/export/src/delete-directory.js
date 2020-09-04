const rimraf = require('rimraf');
const debug = require('debug')('export:delete')

const deleteDirectory = (outputDirectory, keep, archiveFilename, cb) => {
  if (keep || !archiveFilename || !archiveFilename.length) {
    debug(`Keep output directory ${outputDirectory}`)
    return cb(null, outputDirectory, archiveFilename);
  }

  const t0 = Date.now();
  rimraf(outputDirectory, {}, (err) => {
    if (err) {
      debug(`Could not delete ${outputDirectory}: ${err}. Continue`);
      return cb(null, null, archiveFilename)
    }
    debug(`Deleted directory ${outputDirectory} in ${Date.now() - t0}ms`)
    return cb(null, null, archiveFilename)
  })
}

module.exports = deleteDirectory;