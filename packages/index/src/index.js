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
  const [entries, changed ] = await asyncUpdateIndex(fileIndex.data, fsEntries, options.matcherFn)
  const limitExceeded = limitFilter.limitExceeded()

  if (!changed) {
    return [fileIndex, limitExceeded]
  }

  const newIndex = {
    type: 'home-gallery/fileindex@1.0',
    created: now.toISOString(),
    base: path.resolve(directory),
    data: entries
  }
  if (options.dryRun) {
    return [newIndex, limitExceeded]
  }
  const writeIndex = await asyncWriteIndex(filename, newIndex);
  return [writeIndex, limitExceeded]
}

const asyncUpdateChecksum = async (filename, index, updateChecksums, isDryRun) => {
  if (!updateChecksums) {
    return index
  }

  const sha1sumDate = new Date().toISOString();
  const [updateIndex, changed] = await asyncChecksum(index, sha1sumDate)

  if (!changed || isDryRun) {
    return index
  }

  const writeIndex = await asyncWriteIndex(filename, updateIndex);
  updateIndex = null
  return writeIndex
}

const asyncUpdate = async (directory, filename, options) => {
  const t0 = Date.now();
  debug(`Updating file index for directory ${directory}`);

  const filter = await asyncFileFilter(options.exclude, options.excludeFromFile)
  const [index, limitExceeded] = await asyncCreateOrUpdate(directory, filename, {...options, filter})
  const updateIndex = await asyncUpdateChecksum(filename, index, options.checksum, options.dryRun)
  debug(`Updated file index for directory ${directory} in ${Date.now() - t0}ms`);
  return [updateIndex, limitExceeded]
}

module.exports = {
  readStream,
  readStreams,
  update: callbackify(asyncUpdate),
  matcherFns,
  prettyPrint,
  statIndex
}
