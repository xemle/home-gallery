
import Logger from '@home-gallery/logger'

const log = Logger('fetch.database')

import { promisify } from '@home-gallery/common'
import { readOrCreateDatabase, writeDatabase, mergeEntries } from '@home-gallery/database'
import { filterEntriesByQuery, createStringifyEntryCache } from '@home-gallery/query'

const readOrCreateDatabaseAsync = promisify(readOrCreateDatabase)
const writeDatabaseAsync = promisify(writeDatabase)

export const readDatabase = async (databaseFile) => {
  log.trace(`Reading local database from ${databaseFile}...`)
  const t0 = Date.now()
  const database = await readOrCreateDatabaseAsync(databaseFile)
  log.info(t0, `Read local database with ${database.data.length} entries`)
  return database
}

export const mergeDatabase = async (remoteDatabase, localDatabase, databaseFile, deleteLocal) => {
  const updated = new Date().toISOString()
  const t0 = Date.now()
  const [mergedEntries, newEntries] = mergeEntries(localDatabase.data, remoteDatabase.data, [], updated, deleteLocal)
  return writeDatabaseAsync(databaseFile, mergedEntries)
    .then(() => log.info(t0, `Updated database with ${newEntries.length} new entries from remote`))
}

export const filterDatabaseByQuery = async (database, query) => {
  if (!query) {
    log.debug(`No query is given, skip query filtering`)
    return database
  }

  const t1 = Date.now()
  const stringifyEntryCache = createStringifyEntryCache()
  return filterEntriesByQuery(database.data, query, {textFn: stringifyEntryCache.stringifyEntry})
    .then(({entries}) => {
      const filteredDatabase = Object.assign({}, database, {data: entries})
      log.info(t1, `Filtered database with ${database.data.length} entries by query '${query}' to ${filteredDatabase.data.length} entries`)
      return filteredDatabase
    })
    .catch(err => {
      log.error(err, `Could not fitler ${database.data.length} database entries with query ${query}`)
      return Promise.reject(err)
    })
}
