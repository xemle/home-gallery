const fs = require('fs/promises')
const { createWriteStream } = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')
const fetch = require('node-fetch')
const https = require('https');

const { promisify } = require('@home-gallery/common')
const { isDatabaseTypeCompatible, HeaderType: DatabaseHeaderType, migrate } = require('@home-gallery/database')
const { isEventTypeCompatible, HeaderType: EventHeaderType } = require('@home-gallery/events')

const migrateAsync = promisify(migrate)

const log = require('@home-gallery/logger')('fetch.api')

const { EventSource } = require('./event-source')

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

const options = (remote) => {
  if (remote.url.startsWith('https') && remote.insecure) {
    return {
      agent: insecureAgent
    }
  }
  return {}
}

const createIncompatibleError = (data, expectedType) => {
  const err = new Error(`Incompabtible data type ${data?.type}. Expect ${expectedType}`)
  err.code = 'EINCOMP'
  err.type = data?.type
  err.expectedType = expectedType
  return err
}

const fetchDatabase = async (remote) => {
  const { query } = remote;
  log.debug(`Fetching database ${query ? `with query '${query}' ` : ''}from remote ${remote.url}...`)
  const t0 = Date.now()
  return fetch(`${remote.url}/api/database.json${query ? `?q=${query}` : ''}`, options(remote))
    .then(res => {
      if (res.status == 404) {
        log.debug(t0, `Remote ${remote.url} has no database. Continue with empty database`)
        return { type: EventHeaderType, data: [] }
      } else if (!res.ok) {
        throw new Error(`Unexpected response status ${res.status}`)
      }
      return res.json()
    })
    .then(database => {
      if (!isDatabaseTypeCompatible(database?.type)) {
        throw createIncompatibleError(database, DatabaseHeaderType)
      }
      log.info(t0, `Fetched database with ${database?.data?.length || 0} entries from remote ${remote.url}`)
      return migrateAsync(database)
    })
}

const fetchEvents = async (remote) => {
  log.debug(`Fetching events from remote ${remote.url}...`)
  const t0 = Date.now()
  return fetch(`${remote.url}/api/events.json`, options(remote))
    .then(res => {
      if (res.status == 404) {
        log.debug(t0, `Remote has no events. Continue with empty events`)
        return { type: EventHeaderType, data: [] }
      } else if (!res.ok) {
        throw new Error(`Unexpected response status ${res.status}`)
      }
      return res.json()
    }).then(events => {
      if (!isEventTypeCompatible(events?.type)) {
        throw createIncompatibleError(events, EventHeaderType)
      }
      log.info(t0, `Fetched events with ${events?.data?.length || 0} entries from remote ${remote.url}`)
      return events
    })
}

const fetchFile = async (remote, file, storageDir) => {
  log.trace(`Fetching ${file} from remote ${remote.url}...`)
  const targetFilename = path.join(storageDir, file)
  const dir = path.dirname(targetFilename)
  await fs.access(dir).then(() => true).catch(() => fs.mkdir(dir, {recursive: true}))

  const url = `${remote.url}/files/${file}`
  const t0 = Date.now()
  return fetch(url, options(remote))
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP status code is ${res.status} for ${url}`)
      }
      return res
    })
    .then(res => pipeline(
      res.body,
      createWriteStream(targetFilename),
    ))
    .then(() => log.debug(t0, `Fetched file ${file} from remote ${remote.url}`))
    .catch(err => log.warn(err, `Failed to fetch ${file} from remote ${remote.url}: ${err}. Continue`))
}

const connectEventStream = (remote, onEvent) => {
  const source = new EventSource(`${remote.url}/api/events/stream`, options(remote))
  let stopped = false
  let retries = 0
  let timer = false

  source.on('connected', () => {
    log.debug(`Connected to the remote event stream`)
    if (typeof onEvent == 'function') {
      onEvent({ data: { type: 'connect' }})
    }
  })
  source.on('event', event => {
    retries = 0
    if (typeof onEvent == 'function') {
      onEvent(event)
    }
  })

  const retryTimer = retry => retry > 0 ? Math.pow(2, Math.min(9, retries - 1)) * 1000 : 0

  const reconnect = () => {
    if (stopped || timer) {
      return
    }
    timer = setTimeout(() => {
      log.debug(`Connecting to remote event stream of ${remote.url}`)
      source.connect()
      retries++
      timer = false
    }, retryTimer(retries))
  }

  source.on('disconnected', () => {
    log.debug(`Disconnected from the remote event stream. Reconnect`)
    reconnect()
  })


  source.on('error', err => {
    log.info(err, `Failed to connect to remote event stream. Reconnect`)
    reconnect()
  })

  process.once('SIGINT', () => {
    stopped = true
    log.debug(`Stop listening from event stream`)
    source.disconnect()
    clearTimeout(timer)
  })

  reconnect()
}

module.exports = {
  fetchDatabase,
  fetchEvents,
  fetchFile,
  connectEventStream,
}