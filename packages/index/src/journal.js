const { access, unlink } = require('fs/promises')
const path = require('path')
const debug = require('debug')('index:journal')

const { mkdir, readJsonGzip, writeJsonGzip, promisify } = require('@home-gallery/common')

const mkdirAsync = promisify(mkdir)
const writeJsonGzipAsync = promisify(writeJsonGzip)
const readJsonGzipAsync = promisify(readJsonGzip)

const JOURNAL_TYPE = 'home-gallery/file-index-journal@1.0'

const getJournalFilename = (indexFilename, journal) => `${indexFilename}.${journal}.journal`

const mapChanges = (changes, checksumChanges) => {
  const result = {
    adds: changes ? changes.adds : [],
    changes: changes ? changes.changes : [],
    removes: changes ? changes.removes : [],
  }
  if (!checksumChanges) {
    return result
  }
  const newFilenames = result.adds.concat(result.changes).map(entry => entry.filename)
  const onlyChecksumChanges = checksumChanges.filter(entry => newFilenames.indexOf(entry.filename) < 0)
  result.changes = result.changes.concat(onlyChecksumChanges)
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
    data: mapChanges(changes, checksumChanges)
  }
  if (dryRun) {
    return data
  }
  await writeJournal(journalFilename, data)
  debug(`Journal ${journalFilename} created`)
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
    debug(`No journal ${journal} found for file index ${indexFilename}. Skip removal`)
    return
  }
  debug(`Remove journal ${journal} from file index ${indexFilename}`)
  return unlink(journalFilename)
}

module.exports = {
  getJournalFilename,
  createJournal,
  readJournal,
  removeJournal
}
