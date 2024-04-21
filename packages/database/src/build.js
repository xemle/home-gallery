const { pipeline } = require('stream/promises');

const log = require('@home-gallery/logger')('database.build');
const { readStreams } = require('@home-gallery/index');
const { fileFilter, promisify } = require('@home-gallery/common')
const { memoryIndicator, processIndicator, filter, flatten, sort, toList, write } = require('@home-gallery/stream');

const mapToDatabaseEntry = require('./stream/map-database-entry');
const readStorageData = require('./stream/read-storage-data');
const groupByDir = require('./stream/group-by-dir');
const groupSidecarFiles = require('./stream/group-sidecar-files');

const mapToMedia = require('./media/map-media');

const { mergeFromJournal } = require('./merge/merge-journal');
const { groupEntriesById } = require('./merge/entry-group')

const { writeDatabase } = require('./database');

const fileFilterAsync = promisify(fileFilter);

const createEntries = async (entryStream, options) => {
  const storageDir = options.config.storage.dir;
  const { supportedTypes, updated, excludes, excludeFromFile } = options.config.database;
  const fileFilterFn = await fileFilterAsync(excludes, excludeFromFile)

  let result
  await pipeline(
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
    sort(entry => entry.date, true),
    write(entries => result = entries),
  );
  return result;
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

function build(options, cb) {
  const indexFilenames = options.config.fileIndex.files;
  const journal = options.config.fileIndex.journal;

  const databaseFilename = options.config.database.file;
  const updated = options.config.database.updated;
  readStreams(indexFilenames, journal, (err, entryStream) => {
    if (err) {
      return cb(err);
    }
    const t0 = Date.now()
    createEntries(entryStream, options)
      .then(entries => {
        log.info(t0, `Created ${entries.length} database entries`)

        if (journal) {
          mergeFromJournal(indexFilenames, journal, databaseFilename, entries, updated, cb)
        } else {
          writeFullDatabase(entries, databaseFilename, cb)
        }
      }).catch(err => {
        log.error(`Could not build database: ${err}`);
        return cb(err);
      })
  })
}

module.exports = build;
