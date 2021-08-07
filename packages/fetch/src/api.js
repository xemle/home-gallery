const fs = require('fs/promises')
const { createWriteStream } = require('fs')
const path = require('path')
const { pipeline } = require('stream')
const fetch = require('node-fetch')

const { isDatabaseTypeCompatible, HeaderType: DatabaseHeaderType } = require('@home-gallery/database')

const { isEventTypeCompatible, HeaderType: EventHeaderType } = require('@home-gallery/events/dist/node')

const log = require('@home-gallery/logger')('fetch.api')

const fetchDatabase = async serverUrl => {
  log.debug(`Fetching database from remote ${serverUrl}...`)
  const t0 = Date.now()
  return fetch(`${serverUrl}/api/database`)
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
      if (!isDatabaseTypeCompatible(database && database.type)) {
        throw new Error(`Incompabtible remote database type ${database && database.type}. Expect ${DatabaseHeaderType}`)
      }
      log.info(t0, `Fetched database with ${database.data.length} entries from remote ${serverUrl}`)
      return database
    })
}

const fetchEvents = async serverUrl => {
  log.debug(`Fetching events from remote ${serverUrl}...`)
  const t0 = Date.now()
  return fetch(`${serverUrl}/api/events`)
    .then(res => {
      if (res.status == 404) {
        log.debug(t0, `Remote has no events. Continue with empty events`)
        return { type: EventHeaderType, data: [] }
      } else if (!res.ok) {
        throw new Error(`Unexpected response status ${res.status}`)
      }
      return res.json()
    }).then(events => {
      if (!isEventTypeCompatible(events && events.type)) {
        throw new Error(`Incompatible event type '${events && events.type}. Current version is ${EventHeaderType}`)
      }
      log.info(t0, `Fetched events with ${events.data.length} entries from remote ${serverUrl}`)
      return events
    })
}

const fetchFile = async (serverUrl, file, storageDir) => {
  log.trace(`Fetching ${file} from remote ${serverUrl}...`)
  const targetFilename = path.join(storageDir, file)
  const dir = path.dirname(targetFilename)
  await fs.access(dir).then(() => true).catch(() => fs.mkdir(dir, {recursive: true}))

  const url = `${serverUrl}/files/${file}`
  const t0 = Date.now()
  return fetch(url)
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

module.exports = {
  fetchDatabase,
  fetchEvents,
  fetchFile
}