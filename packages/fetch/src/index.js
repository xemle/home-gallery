
const log = require('@home-gallery/logger')('fetch')

const { fetchDatabase, fetchEvents, connectEventStream } = require('./api')
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

const fetch = async ({ serverUrl, databaseFile, storageDir, eventFile, insecure, query, deleteLocal, requireEvents } = {}) => {
  log.info(`Fetch local and remote database`)
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
  await mergeDatabase(remoteFilteredDatabase, localDatabase, databaseFile, deleteLocal)
}

const fetchRemote = async (serverUrl, {query, insecure, requireEvents}) => {
  const [database, events] = await Promise.all([
    fetchDatabase(serverUrl, {query, insecure}),
    fetchEvents(serverUrl, { insecure }).catch(handleEventError(requireEvents))
  ])

  return mergeAndFilterDatabase(database, events, query)
}

const fetchWatchFacade = async (options) => {
  let hasNewDatabase = false
  let isFetching = false

  const doFetch = async () => {
    if (isFetching) {
      return
    }
    isFetching = true
    hasNewDatabase = false
    const t0 = Date.now()
    return fetch(options)
      .then(() => log.info(t0, `Fetched remote from ${options.serverUrl}`))
      .catch(err => {
        log.error(err, `Failed to fetch from remote ${options.serverUrl}: ${err}`)
        return Promise.reject(err)
      })
      .finally(() => {
        isFetching = false
        if (hasNewDatabase) {
          return doFetch()
        }
      })
  }

  const isDatabaseReloadEvent = event => event?.data?.type == 'server' && event?.data?.action == 'databaseReloaded'

  const onEvent = (event) => {
    if (isDatabaseReloadEvent(event)) {
      log.debug(event, `Receiving database reload event`)
      log.info(`Fetching remote due remote database change`)
      hasNewDatabase = true
      doFetch()
    }
  }

  return new Promise((resolve, reject) => {
    if (options.watch) {
      log.info(`Fetch remote in watch mode from ${options.serverUrl}`)
      connectEventStream(options.serverUrl, { insecure: options.insecure }, onEvent)
      doFetch()
      process.once('SIGINT', () => {
        log.info(`Received SIGINT. Stop watch mode`)
        resolve()
      })
    } else {
      doFetch().then(resolve).catch(reject)
    }
  })
}

module.exports = {
  fetch: fetchWatchFacade,
  fetchDatabase,
  fetchEvents,
  fetchRemote,
}