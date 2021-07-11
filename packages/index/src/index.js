const path = require('path');
const debug = require('debug')('index:update');

const { fileFilter, promisify, callbackify } = require('@home-gallery/common');

const readIndex = require('./read');
const createIndex = require('./create');
const updateIndex = require('./update');
const writeIndex = require('./write');
const checksum = require('./checksum');
const { statIndex, prettyPrint } = require('./stat')

const { matcherFns } = require('./merge');
const { readStream, readStreams } = require('./read-stream');
const createLimitFilter = require('./limit-filter');
const { getJournalFilename, createJournal, readJournal, removeJournal } = require('./journal')
const { getIndexName } = require('./utils')

const asyncReadIndex = promisify(readIndex)
const asyncFileFilter = promisify(fileFilter)
const asyncCreateLimitFilter = promisify(createLimitFilter)
const asyncCreateIndex = promisify(createIndex)
const asyncUpdateIndex = promisify(updateIndex)
const asyncWriteIndex = promisify(writeIndex)
const asyncChecksum = promisify(checksum)

const asyncCreateOrUpdate = async (directory, filename, options) => {
  const now = new Date();
  const fileIndex = await asyncReadIndex(filename)
  const limitFilter = await asyncCreateLimitFilter(fileIndex.data.length, options.addLimits, options.filter)
  const fsEntries = await asyncCreateIndex(directory, {...options, filter: limitFilter})
  const [entries, changes] = await asyncUpdateIndex(fileIndex.data, fsEntries, options.matcherFn)
  const limitExceeded = limitFilter.limitExceeded()

  if (!changes) {
    return [fileIndex, limitExceeded, changes]
  }

  const newIndex = {
    type: 'home-gallery/fileindex@1.0',
    created: now.toISOString(),
    base: path.resolve(directory),
    data: entries
  }
  if (options.dryRun) {
    return [newIndex, limitExceeded, changes]
  }
  const writeIndex = await asyncWriteIndex(filename, newIndex);
  return [writeIndex, limitExceeded, changes]
}

const asyncUpdateChecksum = async (filename, index, withChecksum, isDryRun) => {
  if (!withChecksum) {
    return [index, false]
  }

  const sha1sumDate = new Date().toISOString();
  const [updateIndex, checksumChanges] = await asyncChecksum(index, sha1sumDate)

  if (!checksumChanges || isDryRun) {
    return [index, checksumChanges]
  }

  const writeIndex = await asyncWriteIndex(filename, updateIndex);
  return [writeIndex, checksumChanges];
}

const asyncUpdate = async (directory, filename, options) => {
  const t0 = Date.now();
  debug(`Updating file index for directory ${directory}`);

  const filter = await asyncFileFilter(options.exclude, options.excludeFromFile)
  const [index, limitExceeded, changes] = await asyncCreateOrUpdate(directory, filename, {...options, filter})
  const [updateIndex, checksumChanges] = await asyncUpdateChecksum(filename, index, options.checksum, options.dryRun)
  await createJournal(filename, updateIndex, changes, checksumChanges, options.journal, options.dryRun)

  debug(`Updated file index for directory ${directory} in ${Date.now() - t0}ms`);
  return [updateIndex, limitExceeded]
}

module.exports = {
  getIndexName,
  getJournalFilename,
  removeJournal: callbackify(removeJournal),
  readStream,
  readStreams,
  readJournal: callbackify(readJournal),
  update: callbackify(asyncUpdate),
  matcherFns,
  prettyPrint,
  statIndex
}
