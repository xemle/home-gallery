const { pipeline } = require('stream');

const log = require('@home-gallery/logger')('database.build');
const { readStreams } = require('@home-gallery/index');

const { memoryIndicator, processIndicator, filter, flatten, sort, toList } = require('@home-gallery/stream');

const mapToDatabaseEntry = require('./stream/map-database-entry');
const readStorageData = require('./stream/read-storage-data');
const groupByDir = require('./stream/group-by-dir');
const groupSidecarFiles = require('./stream/group-sidecar-files');

const mapToMedia = require('./media/map-media');

const { mergeFromJournal } = require('./merge/merge-journal');
const { groupEntriesById } = require('./merge/entry-group')

const { writeDatabase } = require('./database');

const createEntries = (entryStream, storageDir, options, cb) => {
  const { fileFilterFn, supportedTypes, updated } = options;
  pipeline(
    entryStream,
    filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
    filter(entry => fileFilterFn(entry.filename)),
    mapToDatabaseEntry,
    // Stream entry list
    groupByDir(),
    readStorageData(storageDir, 2),
    processIndicator({name: 'read directories'}),
    groupSidecarFiles,
    // Stream single entry
    flatten(),
    filter(entry => supportedTypes.indexOf(entry.type) >= 0),
    mapToMedia(updated),
    processIndicator({name: 'map to media'}),
    memoryIndicator({intervalMs: 30 * 1000}),
    toList(),
    sort(entry => entry.date, true).on('data', entries => cb(null, entries)),
    err => err && cb(err)
  );
}

const writeFullDatabase = (entries, databaseFilename, cb) => {
  log.debug(`Grouping entries with same ids`);
  const t1 = Date.now()
  const changedEntriesByGroup = groupEntriesById(entries)
  log.info(t1, `Assign id groups to ${changedEntriesByGroup.length} entries of ${entries.length} total entries`);

  const t2 = Date.now()
  writeDatabase(databaseFilename, entries, (err, database) => {
    if (err) {
      return cb(err)
    }
    log.info(t2, `Wrote database with ${database.data.length} entries to ${databaseFilename}`)
    cb(null, database)
  });
}

function build(indexFilenames, storageDir, databaseFilename, options, cb) {
  const { journal, updated } = options;
  readStreams(indexFilenames, journal, (err, entryStream) => {
    if (err) {
      return cb(err);
    }
    const t0 = Date.now()
    createEntries(entryStream, storageDir, options, (err, entries) => {
      if (err) {
        log.error(`Could not build database: ${err}`);
        return cb(err);
      }
      log.info(t0, `Created ${entries.length} database entries`)

      if (journal) {
        mergeFromJournal(indexFilenames, journal, databaseFilename, entries, updated, cb)
      } else {
        writeFullDatabase(entries, databaseFilename, cb)
      }
    })
  })
}

module.exports = build;
