import { access, unlink } from 'fs/promises'
import path from 'path'

import Logger from '@home-gallery/logger'

const log = Logger('index.journal');

import { mkdir, readJsonGzip, writeJsonGzip, promisify, sidecars } from '@home-gallery/common'
const { mapName2Sidecars, getSidecarsByFilename } = sidecars

import { readIndex } from './read.js'
import { writeIndex } from './write.js'
import { IIndex, IIndexChanges, IIndexEntry, IIndexJournal, IIndexOptions } from './types.js';

const mkdirAsync = promisify(mkdir)
const writeJsonGzipAsync = promisify(writeJsonGzip)
const readJsonGzipAsync = promisify(readJsonGzip)

/**
 * - 1.2 Add indexCreated to match journal to index
 */
const JOURNAL_TYPE = 'home-gallery/file-index-journal@1.2'

export function getJournalFilename(indexFilename: string, journal: string) {
  return `${indexFilename}.${journal}.journal`
}

function fileToString(file: IIndexEntry) {
  return `${file.sha1sum ? file.sha1sum.slice(0, 7) : '0000000'}:${file.filename}`
}

function bySize(a: IIndexEntry, b: IIndexEntry) {
  return b.size - a.size
}

function byFilename(a: IIndexEntry, b: IIndexEntry) {
  return a.filename.localeCompare(b.filename)
}

function toDirReducer(result: Record<string, IIndexEntry[]>, entry: IIndexEntry): Record<string, IIndexEntry[]> {
  if (entry.fileType != 'f') {
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

function getChangeType(journal: IIndexChanges, filename: string): 'added' | 'changed' | 'removed' {
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

function addChangesForSidecars(entries: IIndexEntry[], changes: IIndexChanges) {
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

function createJournalChange(updatedEntries: IIndexEntry[], changes: IIndexChanges, updatedChecksumEntries: IIndexEntry[]): IIndexChanges {
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

async function writeJournal(filename: string, data: IIndexJournal) {
  await mkdirAsync(path.dirname(filename))
  return writeJsonGzipAsync(filename, data)
}

export async function createJournal(indexFilename: string, index: IIndex, updatedEntries: IIndexEntry[], changes: IIndexChanges, updatedChecksumEntries: IIndexEntry[], options: IIndexOptions): Promise<IIndexJournal> {
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

export async function readJournal(indexFilename: string, journal: string) {
  const journalFilename = getJournalFilename(indexFilename, journal)
  const data = await readJsonGzipAsync(journalFilename)
  if (data.type != JOURNAL_TYPE) {
    throw new Error(`Invalid journal type ${data.type} of file ${indexFilename}`)
  }
  return data as IIndexJournal
}

type IIndexEntryFilename = (e: IIndexEntry) => string

function applyJournalEntries(index: IIndex, journal: IIndexJournal): IIndexEntry[] {
  let mapJournalFilename: IIndexEntryFilename = e => e.filename
  let mapIndexFilename: IIndexEntryFilename = e => e.filename
  let toIndexFilename: IIndexEntryFilename = e => e.filename

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
    const changes = journal.data.changes.map(({ prevSha1sum, ...entry }) => entry)
    entries.push(...changes)
    entries.push(...journal.data.adds)
  } else {
    // Remove prevSha1sum from change entry and map new base
    const changes = journal.data.changes.map(({ prevSha1sum, ...entry }) => ({ ...entry, filename: toIndexFilename(entry) }))
    entries.push(...changes)
    const adds = journal.data.adds.map(e => ({ ...e, filename: toIndexFilename(e) }))
    entries.push(...adds)
  }

  return entries
}

export async function applyJournal(indexFilename: string, options: IIndexOptions) {
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
    const index = await writeIndex(journal.base, indexFilename, journal.data.adds, options)
    log.info(`Created new file index ${indexFilename} from journal ${options.journal} with ${index.data.length} entries`)
    return index
  }

  const index = await readIndex(indexFilename)
  if (journal.indexCreated != index.created) {
    throw new Error(`Creation date missmatch: File index was created ${index.created} but journal is for ${journal.indexCreated}`)
  }

  let newIndex = index
  const hasBaseChanges = index.base != journal.base
  const hasEntryChanges = journal.data?.adds?.length > 0 || journal.data?.changes?.length > 0 || journal.data?.removes?.length > 0
  const hasChanges = hasBaseChanges || hasEntryChanges
  if (hasBaseChanges) {
    log.warn(`Changing file index base directory from ${index.base} to ${journal.base}`)
  }

  if (hasChanges) {
    const entries = await applyJournalEntries(index, journal)
    newIndex = await writeIndex(journal.base, indexFilename, entries, options)
    log.info(`Applied journal ${options.journal} with ${journal.data.adds.length} adds, ${journal.data.changes.length} changes and ${journal.data.removes.length} removes to file index ${indexFilename} having now ${newIndex.data.length} entries`)
  } else {
    log.info(`Journal ${options.journal} has no data. Skip apply`)
  }

  if (options.keepJournal) {
    log.info(`Keeping journal ${options.journal} for file index ${indexFilename}`)
    return newIndex
  }

  if (!options.dryRun) {
    await unlink(journalFilename)
  }
  log.debug(`Removed ${hasChanges ? 'applied' : 'empty'} journal file ${journalFilename}${options.dryRun ? ' (dry run)' : ''}`)
  return newIndex
}

export async function removeJournal(indexFilename: string, options: IIndexOptions): Promise<void> {
  const journalFilename = getJournalFilename(indexFilename, options.journal)

  const exists = await access(journalFilename).then(() => true).catch(() => false)
  if (!exists) {
    log.warn(`No journal ${options.journal} found for file index ${indexFilename}. Skip removal`)
    return
  }
  if (!options.dryRun) {
    await unlink(journalFilename)
    log.info(`Removed journal ${options.journal} from file index ${indexFilename}`)
  } else {
    log.info(`Removed journal ${options.journal} from file index ${indexFilename} (dry run)`)
  }
}
