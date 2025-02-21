import path from 'path';

import Logger from '@home-gallery/logger'
import { promisify, callbackify } from '@home-gallery/common';

import { readIndex } from './read.js';
import { createIndex } from './create.js';
import { updateIndex } from './update.js';
import { writeIndex } from './write.js';
import { checksum } from './checksum.js';
import { createFilter } from './filter/index.js';
import { createJournal, readJournal as readJournalAsync, removeJournal } from './journal.js'
import { access } from 'fs/promises';
import { IIndex, IIndexChanges, IIndexEntry, IIndexJournal, IIndexOptions } from './types.js';

/**
 * @type {function}
 * @param {string} directory
 * @param {IIndexEntry[]} entries
 * @param {IIndexEntry[]} checksumEntries
 * @return {Promise<IIndexEntry[], boolean>}
 */
const asyncChecksum = promisify(checksum)

const log = Logger('index')

function isLimitExeeded(filter: any): boolean {
  return typeof filter.limitExceeded == 'function' ? filter.limitExceeded() : false
}

async function asyncCreateOrUpdate(directory: string, filename: string, options: IIndexOptions): Promise<[IIndex, IIndexEntry[], IIndexChanges, boolean]> {
  const now = new Date();
  const fileIndex = await readIndex(filename)
  const filter = await createFilter(fileIndex.data, options)
  const fsEntries = await createIndex(directory, {...options, filter})

  const [updatedEntries, changes] = await updateIndex(fileIndex.data, fsEntries, options.matcherFn)
  const limitExceeded = isLimitExeeded(filter)
  log.info(now, `Collected file index changes`)

  return [fileIndex, updatedEntries, changes, limitExceeded]
}

function onlyChangesWithSha1sum(changes: IIndexChanges): IIndexChanges {
  return {
    adds: changes.adds.filter(e => e.sha1sum),
    changes: changes.changes.filter(e => e.sha1sum),
    removes: changes.removes.filter(e => e.sha1sum),
  }
}

function getFileEntriesForChecksum(updatedEntries: IIndexEntry[], changes: IIndexChanges, options: IIndexOptions): IIndexEntry[] {
  const fileEntries = updatedEntries.filter(e => e.isFile)
  if (!options.journal || !changes) {
    return fileEntries
  }

  const journalFileEntries = [
    ...changes.adds.filter(e => e.isFile),
    ...changes.changes.filter(e => e.isFile),
  ]

  const journalFilenames = journalFileEntries.map(e => e.filename)
  const addChecksumEntries = fileEntries.filter(e => !e.sha1sum && !journalFilenames.includes(e.filename))

  journalFileEntries.push(...addChecksumEntries)
  return journalFileEntries
}

async function calculateChecksum(directory: string, updatedEntries: IIndexEntry[], changes: IIndexChanges, options: IIndexOptions): Promise<[IIndexEntry[], boolean]> {
  if (!options.checksum) {
    return [[], false]
  }

  const fileEntries = getFileEntriesForChecksum(updatedEntries, changes, options)
  const checksumEntries = fileEntries.filter(e => !e.sha1sum)
  const sha1sumDate = new Date().toISOString()
  return asyncChecksum(directory, fileEntries, checksumEntries, sha1sumDate)
}

function isUnchanged(changes: IIndexChanges): boolean {
  return !changes.adds.length && !changes.changes.length && !changes.removes.length
}

export async function update(directory: string, filename: string, options: IIndexOptions): Promise<[IIndex, IIndexJournal | false, boolean]> {
  const t0 = Date.now();
  log.info(`Updating file index for directory ${directory}`);

  const [index, updatedEntries, changes, limitExceeded] = await asyncCreateOrUpdate(directory, filename, options)

  const [updatedChecksumEntries, interrupted] = await calculateChecksum(directory, updatedEntries, changes, options)

  if (index.data.length && isUnchanged(changes) && !updatedChecksumEntries.length) {
    if (!options.journal) {
      log.info(t0, `No file changes in directory ${directory}`)
      return [index, false, limitExceeded]
    }
    const journal = await createJournal(directory, filename, index, updatedEntries, changes, updatedChecksumEntries, options)
    log.info(t0, `Created empty file index journal for unchanged directory ${directory}`);
    return [index, journal, limitExceeded]
  }

  if (!options.journal) {
    const newIndex = await writeIndex(directory, filename, updatedEntries, options)
    log.info(t0, `Updated file index for directory ${directory}`);
    return [newIndex, false, limitExceeded]
  }

  const indexExists = await access(filename).then(() => true, () => false)
  let newIndex = index
  if (!indexExists) {
    // Init empty index to match journal later
    newIndex = await writeIndex(directory, filename, [], options)
  }
  const journalChanges = options.checksum && interrupted ? onlyChangesWithSha1sum(changes) : changes
  const journal = await createJournal(directory, filename, newIndex, updatedEntries, journalChanges, updatedChecksumEntries, options)
  log.info(t0, `Created file index journal for directory ${directory}`);
  return [newIndex, journal, limitExceeded]
}

export { getIndexName } from './utils.js';
export { getJournalFilename, applyJournal, removeJournal } from './journal.js'
export { readIndexHead, readStream, readStreams } from './read-stream.js';
export const readJournal = callbackify(readJournalAsync)
export { matcherFns } from './matcher.js';
export { statIndex } from './stat.js'
export { prettyPrint } from './pretty-print.js'
