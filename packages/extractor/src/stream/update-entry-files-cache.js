const log = require('@home-gallery/logger')('extractor.cache.updateEntryFiles');

const { toPipe } = require('./task');

const updateEntryFilesCache = (storage) => {

  const task = (entries, cb) => {
    storage.updateEntryFilesCache(entries, (err) => {
      if (err) {
        log.warn(`Could not write entry files cache: ${err}`)
      }
      cb();
    })
  }

  return toPipe(task);
}

module.exports = { updateEntryFilesCache }
