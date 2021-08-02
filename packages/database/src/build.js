const { pipeline } = require('stream');

const log = require('@home-gallery/logger')('database.build');
const { readStreams } = require('@home-gallery/index');

const { memoryIndicator, processIndicator, filter, flatten, sort, toList } = require('@home-gallery/stream');
const mapToDatabaseEntry = require('./map-database-entry');
const readEntryFilesGrouped = require('./read-entry-files-grouped');
const groupByDir = require('./group-by-dir');
const groupSidecarFiles = require('./group-sidecar-files');
const mapToMedia = require('./map-media');
const { writeDatabase } = require('./write-database');
const { mergeEntry } = require('./merge-entry')
const { mergeFromJournal } = require('./merge-journal')

const uniq = (list, keyFn, mergeFn) => Object.values(list.reduce((id2Entry, entry) => {
  const key = keyFn(entry)
  id2Entry[key] = id2Entry[key] ? mergeFn(id2Entry[key], entry) : entry
  return id2Entry
}, {}))

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
        log.error(`Could not build database: ${err}`);
        return cb(err);
      }
      if (journal) {
        mergeFromJournal(indexFilenames, journal, databaseFilename, entries, cb)
      } else {
        const t0 = Date.now()
        const uniqueEntries = uniq(entries, entry => entry.id, mergeEntry);
        log.info(t0, `Merged ${entries.length} entries to ${uniqueEntries.length} unique entries`);

        const t1 = Date.now()
        writeDatabase(databaseFilename, uniqueEntries, (err, database) => {
          if (err) {
            return cb(err)
          }
          log.info(t1, `Wrote database with ${database.data.length} entries to ${databaseFilename}`)
          cb(null, database)
        });
      }
    })
  })
}

module.exports = build;
