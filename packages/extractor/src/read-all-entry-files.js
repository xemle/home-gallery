const log = require('@home-gallery/logger')('extractor.readAllEntryFiles');

const { toPipe } = require('./task');

const readAllEntryFiles = (storage) => {
  const task = (entry, cb) => {
    storage.readAllEntryFiles(entry, (err, {files, meta}) => {
      if (err) {
        log.warn(`Could not read all entry files of ${entry}: ${err}`);
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
