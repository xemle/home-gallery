
import Logger from '@home-gallery/logger'

const log = Logger('fetch')

import { fetchDatabase, fetchEvents, connectEventStream } from './api.js'
import { readDatabase, mergeDatabase, filterDatabaseByQuery } from './database.js'
import { handlePreviews } from './preview.js'
import { handleEvents, applyEvents } from './event.js'

export { fetchDatabase } from './api.js'
export { readDatabase } from './database.js'

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

/**
 * @param {import('./types').Remote} remote
 */
const fetchAndMerge = async (remote, options = {}) => {
  const database = options.config?.database || {}
  const events = options.config?.events || {}
  const storage = options.config?.storage || {}

  log.info(`Reading local and fetching remote database`)
  const [remoteDatabase, remoteEvents, localDatabase] = await Promise.all([
    fetchDatabase(remote),
    fetchEvents(remote).catch(handleEventError(events.required)),
    readDatabase(database.file)
  ])

  const remoteFilteredDatabase = await mergeAndFilterDatabase(remoteDatabase, remoteEvents, remote.query)
  await handlePreviews(remote, remoteFilteredDatabase, localDatabase, storage.dir)
  await handleEvents(remoteEvents, events.file).catch(err => {
    log.warn(`Failed to merge events: ${err}. Skip events`)
  })
  await mergeDatabase(remoteFilteredDatabase, localDatabase, database.file, remote.deleteLocal)
}


/**
 * @param {import('./types').Remote} remote
 * @param {import('./types').FetchOption} options
 */
export const fetchRemote = async (remote, options) => {
  const [database, events] = await Promise.all([
    fetchDatabase(remote),
    fetchEvents(remote).catch(handleEventError(options?.requireEvents))
  ])

  return mergeAndFilterDatabase(database, events, options?.query || remote?.query)
}

/**
 * @param {import('./types').Remote} remote
 * @param {*} options
 */
export const fetch = async (remote, options) => {
  let hasNewDatabase = false
  let isFetching = false
  let fetchOnReconnect = false

  const doFetch = async () => {
    if (isFetching) {
      return
    }
    isFetching = true
    hasNewDatabase = false
    const t0 = Date.now()
    return fetchAndMerge(remote, options)
      .then(() => log.info(t0, `Fetched remote from ${remote.url}`))
      .catch(err => {
        log.error(err, `Failed to fetch from remote ${remote.url}: ${err}`)
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
      doFetch().catch(err => {
        log.warn(err, `Failed to fetch: ${err}`)
      })
    } else if (fetchOnReconnect && event?.data?.type == 'connect') {
      log.info(`Fetching remote due reconnection to remote`)
      fetchOnReconnect = false
      doFetch().catch(err => {
        log.warn(err, `Failed to fetch: ${err}`)
      })
    }
  }

  return new Promise((resolve, reject) => {
    if (remote.watch) {
      log.info(`Fetch remote in watch mode from ${remote.url}`)
      connectEventStream(remote, onEvent)
      doFetch().catch(err => {
        log.warn(err, `Failed to fetch remote ${err}. Retry fetch on reconnection`)
        fetchOnReconnect = true
      })
      process.once('SIGINT', () => {
        log.info(`Received SIGINT. Stop watch mode`)
        resolve()
      })
    } else {
      doFetch().then(resolve).catch(reject)
    }
  })
}
