const { access, unlink } = require('fs/promises')
const path = require('path')

const log = require('@home-gallery/logger')('index.journal');

const { mkdir, readJsonGzip, writeJsonGzip, promisify, sidecars } = require('@home-gallery/common')
const { mapName2Sidecars, getSidecarsByFilename } = sidecars

const mkdirAsync = promisify(mkdir)
const writeJsonGzipAsync = promisify(writeJsonGzip)
const readJsonGzipAsync = promisify(readJsonGzip)

const JOURNAL_TYPE = 'home-gallery/file-index-journal@1.1'

const getJournalFilename = (indexFilename, journal) => `${indexFilename}.${journal}.journal`

const fileToString = file => `${file.sha1sum ? file.sha1sum.slice(0, 7) : '0000000'}:${file.filename}`

const bySize = (a, b) => b.size - a.size

const byFilename = (a, b) => a.filename.localeCompare(b.filename)

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

const addChangesForSidecars = (index, journalData) => {
  const t0 = Date.now()
  const dir2indexEntries = index.data.reduce(toDirReducer, {})
  const dir2indexEntriesWithRemoves = journalData.removes.reduce(toDirReducer, dir2indexEntries)

  const allJournalEntries = journalData.adds.concat(journalData.changes).concat(journalData.removes)
  const dir2journalEntries = allJournalEntries.reduce(toDirReducer, {})

  const removedFilenames = journalData.removes.map(entry => entry.filename)

  const changedEntries = []
  Object.keys(dir2journalEntries).forEach(dir => {
    const entries = dir2indexEntriesWithRemoves[dir].sort(bySize)
    const name2sidecars = mapName2Sidecars(entries)

    const journalFilenames = dir2journalEntries[dir].map(entry => entry.filename)

    const isPristineFile = filename => !journalFilenames.includes(filename) && !removedFilenames.includes(filename)

    journalFilenames.forEach(filename => {
      const sidecars = getSidecarsByFilename(name2sidecars, filename)
      if (!sidecars) {
        return
      }
      sidecars.filter(sidecar => isPristineFile(sidecar.filename)).forEach(sidecar => {
        const changeType = getChangeType(journalData, filename)
        log.trace(`Add ${fileToString(sidecar)} affected sidecar to journal changes for ${changeType} file ${filename}`)
        changedEntries.push(sidecar)
      })
    })
  })

  if (changedEntries.length) {
    journalData.changes = journalData.changes.concat(changedEntries).sort(byFilename)
    log.debug(t0, `Added ${changedEntries.length} affected sidecars entries to file changes`)
  }
}

const mapChanges = (index, changes, checksumChanges) => {
  const result = {
    adds: changes ? changes.adds : [],
    changes: changes ? changes.changes : [],
    removes: changes ? changes.removes : [],
  }
  if (!checksumChanges) {
    addChangesForSidecars(index, result)
    return result
  }
  const newFilenames = result.adds.concat(result.changes).map(entry => entry.filename)
  const onlyChecksumChanges = checksumChanges.filter(entry => newFilenames.indexOf(entry.filename) < 0)
  result.changes = result.changes.concat(onlyChecksumChanges)
  addChangesForSidecars(index, result)
  return result
}

const writeJournal = async (filename, data) => {
  await mkdirAsync(path.dirname(filename))
  return writeJsonGzipAsync(filename, data)
}

const createJournal = async (indexFilename, index, changes, checksumChanges, journal, dryRun) => {
  if (!journal) {
    return
  }

  const journalFilename = getJournalFilename(indexFilename, journal)

  const data = {
    type: JOURNAL_TYPE,
    created: index.created,
    base: index.base,
    data: mapChanges(index, changes, checksumChanges)
  }
  if (dryRun) {
    return data
  }
  await writeJournal(journalFilename, data)
  log.info(`Journal ${journalFilename} created`)
  return data
}

const readJournal = async (indexFilename, journal) => {
  const journalFilename = getJournalFilename(indexFilename, journal)
  const data = await readJsonGzipAsync(journalFilename)
  if (data.type != JOURNAL_TYPE) {
    throw new Error(`Invalid journal type ${data.type} of file ${indexFilename}`)
  }
  return data
}

const removeJournal = async (indexFilename, journal) => {
  const journalFilename = getJournalFilename(indexFilename, journal)

  const exists = await access(journalFilename).then(() => true).catch(() => false)
  if (!exists) {
    log.warn(`No journal ${journal} found for file index ${indexFilename}. Skip removal`)
    return
  }
  log.info(`Remove journal ${journal} from file index ${indexFilename}`)
  return unlink(journalFilename)
}

module.exports = {
  getJournalFilename,
  createJournal,
  readJournal,
  removeJournal
}
