
const log = require('@home-gallery/logger')('fetch.database')

const { promisify } = require('@home-gallery/common')
const { readOrCreateDatabase, writeDatabase, mergeEntries } = require('@home-gallery/database')
const { applyEvents } = require('./event')
const { filterEntriesByQuery } = require('@home-gallery/query')

const readOrCreateDatabaseAsync = promisify(readOrCreateDatabase)
const writeDatabaseAsync = promisify(writeDatabase)

const readDatabase = async (databaseFile) => {
  log.trace(`Reading local database from ${databaseFile}...`)
  const t0 = Date.now()
  const database = await readOrCreateDatabaseAsync(databaseFile)
  log.info(t0, `Read local database with ${database.data.length} entries`)
  return database
}

const mergeDatabase = async (remoteDatabase, localDatabase, databaseFile) => {
  const t0 = Date.now()
  const id2local = localDatabase.data.reduce((ids, entry) => { ids[entry.id] = entry; return ids }, {})
  const remoteEntries = remoteDatabase.data.filter(entry => !id2local[entry.id] || entry.updated > id2local[entry.id].updated)
  if (!remoteEntries.length) {
    log.info(`No new entries found. Skip database merge`)
    return
  }

  const [mergedEntries, changedEntries] = mergeEntries(localDatabase.data, remoteEntries, [])
  if (changedEntries.length) {
    log.warn({data: changedEntries.map(e => e.id)}, `Could not resolve change of ${changedEntries.length} database entries completely caused by the database merge. Some data or properties such as tags might be out of sync. See list of ids in the logs for details`)
  }
  return writeDatabaseAsync(databaseFile, mergedEntries)
    .then(() => log.info(t0, `Updated database with ${remoteEntries.length} new entries from remote`))
}

const filterDatabaseByQuery = async (database, query) => {
  if (!query) {
    log.debug(`No query is given, skip query filtering`)
    return database
  }

  return new Promise((resolve, reject) => {
    const t1 = Date.now()
    filterEntriesByQuery(database.data, query, (err, entries) => {
      if (err) {
        log.error(err, `Could not fitler ${database.data.length} database entries with query ${query}`)
        reject(err)
      } else {
        const filteredDatabase = Object.assign({}, database, {data: entries})
        log.info(t1, `Filtered database with ${database.data.length} entries by query '${query}' to ${filteredDatabase.data.length} entries`)
        resolve(filteredDatabase)
      }
    })
  })
}

module.exports = {
  readDatabase,
  mergeDatabase,
  filterDatabaseByQuery
}