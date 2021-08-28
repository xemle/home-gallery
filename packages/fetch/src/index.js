
const log = require('@home-gallery/logger')('fetch')

const { fetchDatabase, fetchEvents } = require('./api')
const { readDatabase, mergeDatabase, filterDatabaseByQuery } = require('./database')
const { handlePreviews } = require('./preview')
const { handleEvents, applyEvents } = require('./event')

const handleEventError = requireEvents => {
  return err => {
    if (requireEvents) {
      throw err
    } else if (err.code == 'EINCOMP') {
      log.warn(`Remote events are incompatible. Continue with empty events`)
    } else {
      log.warn(`Failed to fetch events: ${err}. Continue with empty events`)
    }
    return {
      data: []
    }
  }
}

const mergeAndFilterDatabase = async (database, events, query) => {
  const appliedDatabase = applyEvents(database, events)
  return filterDatabaseByQuery(appliedDatabase, query)
}

const fetch = async ({ serverUrl, databaseFile, storageDir, eventFile, insecure, query, requireEvents } = {}) => {
  const [remoteDatabase, remoteEvents, localDatabase] = await Promise.all([
    fetchDatabase(serverUrl, { query, insecure }),
    fetchEvents(serverUrl, { insecure }).catch(handleEventError(requireEvents)),
    readDatabase(databaseFile)
  ])

  const remoteFilteredDatabase = await mergeAndFilterDatabase(remoteDatabase, remoteEvents, query)
  await handlePreviews(serverUrl, remoteFilteredDatabase, localDatabase, storageDir, { insecure })
  await handleEvents(remoteEvents, eventFile).catch(err => {
    log.warn(`Failed to merge events: ${err}. Skip events`)
  })
  await mergeDatabase(remoteFilteredDatabase, localDatabase, databaseFile)
}

const fetchRemote = async (serverUrl, {query, insecure, requireEvents}) => {
  const [database, events] = await Promise.all([
    fetchDatabase(serverUrl, {query, insecure}),
    fetchEvents(serverUrl, { insecure }).catch(handleEventError(requireEvents))
  ])

  return mergeAndFilterDatabase(database, events, query)
}

module.exports = {
  fetch,
  fetchDatabase,
  fetchEvents,
  fetchRemote,
}