const debug = require('debug')('extractor:readAllEntryFiles');

const { toPipe } = require('./task');

const readAllEntryFiles = (storage) => {
  const task = (entry, cb) => {
    storage.readAllEntryFiles(entry, (err, {files, meta}) => {
      if (err) {
        debug(`Could not read all entry files of ${entry}: ${err}`);
        return cb();
      }
      entry.files = files;
      entry.meta = meta;
      cb();
    })
  }

  return toPipe(task);
}

module.exports = readAllEntryFiles;
