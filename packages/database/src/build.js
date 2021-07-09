const { pipeline } = require('stream');

const { readStreams } = require('@home-gallery/index');

const { memoryIndicator, processIndicator, filter, flatten, sort, each, toList } = require('@home-gallery/stream');
const mapToDatabaseEntry = require('./map-database-entry');
const readEntryFilesGrouped = require('./read-entry-files-grouped');
const groupByDir = require('./group-by-dir');
const groupSidecarFiles = require('./group-sidecar-files');
const mapToMedia = require('./map-media');
const { writeDatabase } = require('./write-database');

const uniq = (list, keyFn) => list.reduce(([result, keys], entry) => {
  const key = keyFn(entry)
  if (!keys[key]) {
    keys[key] = true
    result.push(entry)
  }
  return [result, keys]
}, [[], {}])[0]

const createEntries = (entryStream, storageDir, options, cb) => {
  const { fileFilterFn, supportedTypes } = options;
  pipeline(
    entryStream,
    filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
    filter(entry => fileFilterFn(entry.filename)),
    mapToDatabaseEntry,
    // Stream entry list
    groupByDir(),
    readEntryFilesGrouped(storageDir, 2),
    processIndicator({name: 'read directories'}),
    groupSidecarFiles,
    // Stream single entry
    flatten(),
    filter(entry => supportedTypes.indexOf(entry.type) >= 0),
    mapToMedia,
    processIndicator({name: 'map to media'}),
    memoryIndicator({intervalMs: 30 * 1000}),
    toList(),
    sort(entry => entry.date, true).on('data', entries => cb(null, entries)),
    err => err && cb(err)
  );
}

function build(indexFilenames, storageDir, databaseFilename, options, cb) {
  const { journal } = options;
  readStreams(indexFilenames, journal, (err, entryStream) => {
    if (err) {
      return cb(err);
    }
    createEntries(entryStream, storageDir, options, (err, entries) => {
      if (err) {
        debug(`Could not build database: ${err}`);
        return cb(err);
      }
      const uniqueEntries = uniq(entries, entry => entry.id);
      writeDatabase(databaseFilename, uniqueEntries, (err, database) => {
        if (err) {
          return cb(err);
        }
        cb(null, database);
      });
    })
  })

}

module.exports = build;
