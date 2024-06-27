import rimraf from 'rimraf';

import Logger from '@home-gallery/logger'

const log = Logger('export.rmdir');

export const deleteDirectory = (dir, keep, archiveFile, cb) => {
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
