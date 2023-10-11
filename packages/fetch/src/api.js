const fs = require('fs/promises')
const { createWriteStream } = require('fs')
const path = require('path')
const { pipeline } = require('stream')
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

const options = (url, insecure) => {
  if (url.startsWith('https') && insecure) {
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

const fetchDatabase = async (serverUrl, {query, insecure} = {}) => {
  log.debug(`Fetching database ${query ? `with query '${query}' ` : ''}from remote ${serverUrl}...`)
  const t0 = Date.now()
  return fetch(`${serverUrl}/api/database.json${query ? `?q=${query}` : ''}`, options(serverUrl, insecure))
    .then(res => {
      if (res.status == 404) {
        log.debug(t0, `Remote ${serverUrl} has no database. Continue with empty database`)
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
      log.info(t0, `Fetched database with ${database?.data?.length || 0} entries from remote ${serverUrl}`)
      return migrateAsync(database)
    })
}

const fetchEvents = async (serverUrl, { insecure } = {}) => {
  log.debug(`Fetching events from remote ${serverUrl}...`)
  const t0 = Date.now()
  return fetch(`${serverUrl}/api/events.json`, options(serverUrl, insecure))
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
      log.info(t0, `Fetched events with ${events?.data?.length || 0} entries from remote ${serverUrl}`)
      return events
    })
}

const fetchFile = async (serverUrl, file, storageDir, { insecure } = {}) => {
  log.trace(`Fetching ${file} from remote ${serverUrl}...`)
  const targetFilename = path.join(storageDir, file)
  const dir = path.dirname(targetFilename)
  await fs.access(dir).then(() => true).catch(() => fs.mkdir(dir, {recursive: true}))

  const url = `${serverUrl}/files/${file}`
  const t0 = Date.now()
  return fetch(url, options(url, insecure))
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP status code is ${res.status}`)
      }
      return res
    })
    .then(res => {
      return new Promise((resolve, reject) => {
        pipeline(
          res.body,
          createWriteStream(targetFilename),
          err => err ? reject(err) : resolve()
        )
      })
    })
    .then(() => log.debug(t0, `Fetched file ${file} from remote ${serverUrl}`))
    .catch(err => log.warn(err, `Failed to fetch ${file} from remote ${url}: ${err}. Continue`))
}

const connectEventStream = (url, { insecure }, onEvent) => {
  const source = new EventSource(`${url}/api/events/stream`, options(url, insecure))
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
      log.debug(`Connecting to remote event stream of ${url}`)
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