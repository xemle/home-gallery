import path from 'path';

import Logger from '@home-gallery/logger'
import { promisify, callbackify } from '@home-gallery/common';

import { readIndex } from './read.js';
import { createIndex } from './create.js';
import { updateIndex } from './update.js';
import { writeIndex } from './write.js';
import { checksum } from './checksum.js';
import { createFilter } from './filter/index.js';
import { createJournal, readJournal as readJournalAsync, removeJournal as removeJournalAsync } from './journal.js'

const asyncReadIndex = promisify(readIndex)
const asyncCreateIndex = promisify(createIndex)
const asyncUpdateIndex = promisify(updateIndex)
const asyncWriteIndex = promisify(writeIndex)
const asyncChecksum = promisify(checksum)

const log = Logger('index')

const isLimitExeeded = filter => typeof filter.limitExceeded == 'function' ? filter.limitExceeded() : false

const asyncCreateOrUpdate = async (directory, filename, options) => {
  const now = new Date();
  const fileIndex = await asyncReadIndex(filename)
  const filter = await createFilter(fileIndex.data, options)
  const fsEntries = await asyncCreateIndex(directory, {...options, filter})
  const [entries, changes] = await asyncUpdateIndex(fileIndex.data, fsEntries, options.matcherFn)
  const limitExceeded = isLimitExeeded(filter)

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
  const [updateIndex, checksumChanges, interrupted] = await asyncChecksum(index, sha1sumDate)

  if (checksumChanges && checksumChanges.length && !isDryRun) {
    const t0 = Date.now()
    index = await asyncWriteIndex(filename, updateIndex);
    log.info(t0, `File index was saved to ${filename} and ${checksumChanges.length} entries have new checkums/ids`)
  }
  if (interrupted) {
    const err = new Error(`Checksum calculation was aborted by user`)
    err.code = 'EUSERABORT'
    return Promise.reject(err)
  }

  return [index, checksumChanges];
}

const asyncUpdate = async (directory, filename, options) => {
  const t0 = Date.now();
  log.info(`Updating file index for directory ${directory}`);

  const [index, limitExceeded, changes] = await asyncCreateOrUpdate(directory, filename, options)
  const [updateIndex, checksumChanges] = await asyncUpdateChecksum(filename, index, options.checksum, options.dryRun)
  await createJournal(filename, updateIndex, changes, checksumChanges, options.journal, options.dryRun)

  log.info(t0, `Updated file index for directory ${directory}`);
  return [updateIndex, limitExceeded]
}

export { getIndexName } from './utils.js';
export { getJournalFilename } from './journal.js'
export const removeJournal = callbackify(removeJournalAsync)
export { readIndexHead, readStream, readStreams } from './read-stream.js';
export const readJournal = callbackify(readJournalAsync)
export const update = callbackify(asyncUpdate)
export { matcherFns } from './matcher.js';
export { statIndex } from './stat.js'
export { prettyPrint } from './pretty-print.js'
