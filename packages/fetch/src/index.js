
const log = require('@home-gallery/logger')('fetch')

const { fetchDatabase, fetchEvents } = require('./api')
const { readDatabase, mergeDatabase, filterDatabaseByQuery } = require('./database')
const { handlePreviews } = require('./preview')
const { handleEvents, applyEvents } = require('./event')

const handleIncompatbileEvents = err => {
  if (err.code == 'EINCOMP') {
    log.warn(`Remote events are incompatible. Continue with empty events`)
    return {
      data: []
    }
  }
  throw err
}

const fetch = async ({ serverUrl, databaseFile, storageDir, eventFile, insecure } = {}) => {
  const [remoteDatabase, remoteEvents, localDatabase] = await Promise.all([
    fetchDatabase(serverUrl, { insecure }),
    fetchEvents(serverUrl, { insecure }).catch(handleIncompatbileEvents),
    readDatabase(databaseFile)
  ])

  await handlePreviews(serverUrl, remoteDatabase, localDatabase, storageDir, { insecure })
  await handleEvents(remoteEvents, eventFile).catch(err => {
    log.warn(`Failed to merge events: ${err}. Skip events`)
  })
  await mergeDatabase(remoteDatabase, localDatabase, databaseFile)
}

const fetchRemote = async (serverUrl, {query, insecure}) => {
  const [database, events] = await Promise.all([
    fetchDatabase(serverUrl, {query, insecure}),
    fetchEvents(serverUrl, { insecure }).catch(handleIncompatbileEvents)
  ])

  const appliedDatabase = applyEvents(database, events)
  return filterDatabaseByQuery(appliedDatabase, query)
}

module.exports = {
  fetch,
  fetchDatabase,
  fetchEvents,
  fetchRemote,
}