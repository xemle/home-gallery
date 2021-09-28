const log = require('@home-gallery/logger')('database.mergeJournal');
const { getIndexName, getJournalFilename, readJournal } = require('@home-gallery/index');

const { mergeEntries } = require('./merge-entry')
const { initDatabase, readDatabase } = require('./read-database')
const { writeDatabase } = require('./write-database')

const readJournals = (indexFilenames, journal, cb) => {
  let i = 0;
  const result = [];

  const next = () => {
    if (i >= indexFilenames.length) {
      return cb(null, result)
    }
    const indexFilename = indexFilenames[i++]
    const index = getIndexName(indexFilename)
    readJournal(indexFilename, journal, (err, journalData) => {
      if (!err) {
        log.info(`Read file index journal ${getJournalFilename(indexFilename, journal)}`)
        result.push({index, data: journalData.data})
      }
      next()
    })
  }

  next()
}

const getJournalRemoves = (journals) => {
  return journals.reduce((result, journal) => {
    const { index, data } = journal
    const { changes, removes } = data

    const removed = result.concat(removes.map(({filename, sha1sum}) => { return {index, filename, id: sha1sum} }))
    return removed.concat(changes.filter(entry => entry.prevSha1sum && entry.prevSha1sum != entry.sha1sum).map(({filename, prevSha1sum}) => { return {index, filename, id: prevSha1sum} }))
  }, [])
}

const hasJournalChanges = (entries, removedFiles) => !entries.length && !removedFiles.length

const diffCount = (newData, oldData) => {
  const diff = newData.length - oldData.length
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff}`
}

const mergeFromJournal = (indexFilenames, journal, databaseFilename, entries, cb) => {
  readJournals(indexFilenames, journal, (err, journals) => {
    if (err) {
      return cb(err)
    }
    const removedFiles = getJournalRemoves(journals)
    if (hasJournalChanges(entries, removedFiles)) {
      const err = new Error(`Journals contain no changes`)
      err.code = 'ENOCHANGE'
      return cb(err)
    }
    const t0 = Date.now()
    readDatabase(databaseFilename, (err, database) => {
      if (err && err.code == 'ENOENT') {
        log.info(`Initialize non existing database file ${databaseFilename}`)
        database = initDatabase([])
      } else if (err) {
        return cb(err)
      } else {
        log.info(t0, `Read database from ${databaseFilename} with ${database.data.length} entries`)
      }

      const t1 = Date.now()
      const mergedEntries = mergeEntries(database.data, entries, removedFiles)
      log.info(t1, `Merged ${entries.length} new and ${removedFiles.length} removed entries from journals to ${mergedEntries.length} entries (${diffCount(mergedEntries, database.data)}) to the database`)

      const t2 = Date.now()
      writeDatabase(databaseFilename, mergedEntries, (err, database) => {
        if (err) {
          return cb(err)
        }
        log.info(t2, `Wrote database with ${database.data.length} entries to ${databaseFilename}`)
        cb(err, database)
      });
    })
  })
}

module.exports = {
  mergeFromJournal
}