import { access, unlink } from 'fs/promises'
import path from 'path'

import Logger from '@home-gallery/logger'

const log = Logger('index.journal');

import { mkdir, readJsonGzip, writeJsonGzip, promisify, sidecars } from '@home-gallery/common'
const { mapName2Sidecars, getSidecarsByFilename } = sidecars

import { readIndex } from './read.js'
import { writeIndex } from './write.js'

const mkdirAsync = promisify(mkdir)
const writeJsonGzipAsync = promisify(writeJsonGzip)
const readJsonGzipAsync = promisify(readJsonGzip)

/**
 * - 1.2 Add indexCreated to match journal to index
 */
const JOURNAL_TYPE = 'home-gallery/file-index-journal@1.2'

/** @typedef {import('./types.d').IIndexEntry} IIndexEntry */

export const getJournalFilename = (indexFilename, journal) => `${indexFilename}.${journal}.journal`

/**
 * @param {IIndexEntry} file
 * @returns {string}
 */
const fileToString = file => `${file.sha1sum ? file.sha1sum.slice(0, 7) : '0000000'}:${file.filename}`

/**
 * @param {IIndexEntry} a
 * @param {IIndexEntry} b
 * @returns {number}
 */
const bySize = (a, b) => b.size - a.size

/**
 * @param {IIndexEntry} a
 * @param {IIndexEntry} b
 * @returns {number}
 */
const byFilename = (a, b) => a.filename.localeCompare(b.filename)

/**
 * @param {Record<string, IIndexEntry[]>} result
 * @param {IIndexEntry} entry
 * @returns {Record<string, IIndexEntry[]>}
 */
const toDirReducer = (result, entry) => {
  if (entry.fileType != 'f')  {
    return result
  }
  const dir = path.dirname(entry.filename)
  if (result[dir]) {
    result[dir].push(entry)
  } else {
    result[dir] = [entry]
  }
  return result
}

const getChangeType = (journal, filename) => {
  let entry = journal.changes.find(entry => entry.filename == filename)
  if (entry) {
    return 'changed'
  }
  entry = journal.adds.find(entry => entry.filename == filename)
  if (entry) {
    return 'added'
  } else {
    return 'removed'
  }
}

/**
 * @param {IIndexEntry} entries
 * @param {import('./types.d').IIndexChanges} changes
 */
const addChangesForSidecars = (entries, changes) => {
  const t0 = Date.now()
  const dir2indexEntries = entries.reduce(toDirReducer, {})
  const dir2indexEntriesWithRemoves = changes.removes.reduce(toDirReducer, dir2indexEntries)

  const dir2journalEntries = changes.adds.reduce(toDirReducer, {})
  changes.changes.reduce(toDirReducer, dir2journalEntries)
  changes.removes.reduce(toDirReducer, dir2journalEntries)

  const removedFilenames = changes.removes.map(entry => entry.filename)

  const changedEntries = []
  const journalEntryDirs = Object.keys(dir2journalEntries)
  for (const dir of journalEntryDirs) {
    const entries = dir2indexEntriesWithRemoves[dir].sort(bySize)
    const name2sidecars = mapName2Sidecars(entries)

    const journalFilenames = dir2journalEntries[dir].map(entry => entry.filename)

    const isPristineFile = filename => !journalFilenames.includes(filename) && !removedFilenames.includes(filename)

    for (const filename of journalFilenames) {
      const sidecars = getSidecarsByFilename(name2sidecars, filename)
      if (!sidecars) {
        return
      }
      sidecars.filter(sidecar => isPristineFile(sidecar.filename)).forEach(sidecar => {
        const changeType = getChangeType(changes, filename)
        log.trace(`Add ${fileToString(sidecar)} affected sidecar to journal changes for ${changeType} file ${filename}`)
        changedEntries.push(sidecar)
      })
    }
  }

  if (!changedEntries.length) {
    return
  }

  changes.changes.push(...changedEntries)
  changes.changes.sort(byFilename)
  log.debug(t0, `Added ${changedEntries.length} affected sidecars entries to file changes`)
}

/**
 * @param {IIndexEntry[]} updatedEntries
 * @param {import('./types.d').IIndexChanges | false} changes
 * @param {IIndexEntry[]} updatedChecksumEntries
 * @returns {import('./types.d').IIndexChanges}
 */
const createJournalChange = (updatedEntries, changes, updatedChecksumEntries) => {
  const result = {
    adds: changes?.adds || [],
    changes: changes?.changes || [],
    removes: changes?.removes || [],
  }
  if (!updatedChecksumEntries.length) {
    addChangesForSidecars(updatedEntries, result)
    return result
  }
  const journalFilenames = [...result.adds, ...result.changes].map(entry => entry.filename)
  const onlyChecksumChanges = updatedChecksumEntries.filter(entry => !journalFilenames.includes(entry.filename))
  result.changes.push(...onlyChecksumChanges)
  result.changes.sort(byFilename)
  addChangesForSidecars(updatedEntries, result)
  return result
}

const writeJournal = async (filename, data) => {
  await mkdirAsync(path.dirname(filename))
  return writeJsonGzipAsync(filename, data)
}

/**
 * @param {string} indexFilename
 * @param {import('./types.d').IIndex} index
 * @param {IIndexEntry[]} updatedEntries
 * @param {import('./types.d').IIndexChanges | false} changes
 * @param {IIndexEntry[]} updatedChecksumEntries
 * @param {import('./types.d').IIndexOptions} options
 * @returns {Promise<import('./types.d').IIndexJournal>}
 */
export const createJournal = async (indexFilename, index, updatedEntries, changes, updatedChecksumEntries, options) => {
  /** @type {import('./types.d').IIndexJournal} */
  const journal = {
    type: JOURNAL_TYPE,
    created: new Date().toISOString(),
    base: index.base,
    indexCreated: index.created,
    data: createJournalChange(updatedEntries, changes, updatedChecksumEntries)
  }

  if (options.dryRun) {
    return journal
  }

  const journalFilename = getJournalFilename(indexFilename, options.journal)
  await writeJournal(journalFilename, journal)
  log.debug(`Journal ${journalFilename} created`)
  return journal
}

export const readJournal = async (indexFilename, journal) => {
  const journalFilename = getJournalFilename(indexFilename, journal)
  const data = await readJsonGzipAsync(journalFilename)
  if (data.type != JOURNAL_TYPE) {
    throw new Error(`Invalid journal type ${data.type} of file ${indexFilename}`)
  }
  return data
}

/**
 * @param {import('./types.d').IIndex} index
 * @param {import('./types.d').IIndexJournal} journal
 * @returns {IIndexEntry[]}
 */
const applyJournalEntries = (index, journal) => {
  /** @type {(e: IIndexEntry) => string} */
  let mapJournalFilename = e => e.filename
  /** @type {(e: IIndexEntry) => string} */
  let mapIndexFilename = e => e.filename
  /** @type {(e: IIndexEntry) => string} */
  let toIndexFilename = e => e.filename

  const isSameBase = index.base == journal.base
  if (!isSameBase) {
    mapJournalFilename = e => path.join(journal.base, e.filename)
    mapIndexFilename = e => path.join(index.base, e.filename)
    toIndexFilename = e => path.relative(index.base, mapJournalFilename(e))
  }

  const filterFilenameSet = [...journal.data.changes, ...journal.data.removes]
    .reduce((result, e) => {
      const filename = mapJournalFilename(e)
      result[filename] = true
      return result
    }, {})

  const entries = index.data.filter(e => !filterFilenameSet[mapIndexFilename(e)])

  if (isSameBase) {
    // Remove prevSha1sum from change entry
    const changes = journal.data.changes.map(({prevSha1sum, ...entry}) => entry)
    entries.push(...changes)
    entries.push(...journal.data.adds)
  } else {
    // Remove prevSha1sum from change entry and map new base
    const changes = journal.data.changes.map(({prevSha1sum, ...entry}) => ({...entry, filename: toIndexFilename(entry.filename)}))
    entries.push(...changes)
    const adds = journal.data.adds.map(e => ({...e, filename: toIndexFilename(e)}))
    entries.push(...adds)
  }

  return entries
}

/**
 * @param {string} indexFilename
 * @param {import('./types.d').IIndexOptions} options
 */
export const applyJournal = async (indexFilename, options) => {
  if (!options.journal) {
    throw new Error(`Journal id is empty for file index ${indexFilename}`)
  }

  const journalFilename = getJournalFilename(indexFilename, options.journal)
  const journalExists = await access(journalFilename).then(() => true, () => false)

  if (!journalExists) {
    throw new Error(`Journal ${options.journal} for file index ${indexFilename} does not exist`)
  }

  /** @type {import('./types.d').IIndexJournal} */
  const journal = await readJournal(indexFilename, options.journal)
  const indexExists = await access(indexFilename).then(() => true, () => false)
  if (!indexExists) {
    const index = writeIndex(journal.base, indexFilename, journal.data.adds, options)
    log.info(`Created new file index ${indexFilename} from journal ${options.journal} with ${index.data.length} entries`)
    return index
  }

  const index = await readIndex(indexFilename)
  if (journal.indexCreated != index.created) {
    throw new Error(`Creation date missmatch: File index was created ${index.created} but journal is for ${journal.indexCreated}`)
  }
  if (index.base != journal.base) {
    log.warn(`Changing file index base directory from ${index.base} to ${journal.base}`)
  }

  const entries = await applyJournalEntries(index, journal)
  const newIndex = await writeIndex(journal.base, indexFilename, entries, options)
  log.info(`Applied journal journal ${options.journal} with ${journal.data.adds.length} adds, ${journal.data.changes.length} changes and ${journal.data.removes.length} removes to file index ${indexFilename} having now ${newIndex.data.length} entries`)


  if (options.keepJournal) {
    log.info(`Keeping journal ${options.journal} for file index ${indexFilename}`)
    return newIndex
  }

  if (!options.dryRun) {
    await unlink(journalFilename)
    log.debug(`Removed applied journal file ${journalFilename}`)
  } else {
    log.debug(`Removed applied journal file ${journalFilename} (dry run)`)
  }
  return newIndex
}

/**
 *
 * @param {string} indexFilename
 * @param {import('./types.d').IIndexOptions} journal
 * @returns
 */
export const removeJournal = async (indexFilename, options) => {
  const journalFilename = getJournalFilename(indexFilename, options.journal)

  const exists = await access(journalFilename).then(() => true).catch(() => false)
  if (!exists) {
    log.warn(`No journal ${journal} found for file index ${indexFilename}. Skip removal`)
    return
  }
  if (!options.dryRun) {
    await unlink(journalFilename)
    log.info(`Removed journal ${options.journal} from file index ${indexFilename}`)
  } else {
    log.info(`Removed journal ${options.journal} from file index ${indexFilename} (dry run)`)
  }
}
