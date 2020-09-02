const path = require('path');
const debug = require('debug')('extract:writeEntryFilesCache');

const { toPipe } = require('./task');

const updateEntryFilesCache = (storage) => {

  const task = (entries, cb) => {
    storage.updateEntryFilesCache(entries, (err) => {
      if (err) {
        debug(`Could not write entry files cache: ${err}`)
      }
      cb();
    })
  }

  return toPipe(task);
}

module.exports = { updateEntryFilesCache }
