import Logger from '@home-gallery/logger'

const log = Logger('export.meta.entry')

import { promisify } from '@home-gallery/common'

import { readDatabase } from '@home-gallery/database'
import { readEvents, createHeader, applyEvents } from '@home-gallery/events'

const readDatabaseAsync = promisify(readDatabase)

const readDatabaseFile = async (databaseFile) => {
  log.trace(`Reading database file ${databaseFile}`)
  const t0 = Date.now()
  const database = await readDatabaseAsync(databaseFile)
  log.debug(t0, `Read database file ${databaseFile} with ${database?.data?.length} entries`)
  return database
}

const readEventsFile = async (eventsFile) => {
  log.trace(`Reading events file ${eventsFile}`)
  const t0 = Date.now()
  return await readEvents(eventsFile)
    .then(events => {
      log.debug(t0, `Read events file ${eventsFile} with ${events?.data?.length} events`)
      return events
    })
    .catch(err => {
      if (err?.code == 'ENOENT') {
        const events = {...createHeader(), data: []}
        log.trace(`Events file ${eventsFile} does not exists. Use empty list`)
        return events
      }
      throw err
    })
}

function entryToString() {
  return `${this.id.substring(0, 7)}:${this.files[0].index}:${this.files[0].filename}`
}

const dateMatcher = /^\d{4}(-\d{2}(-\d{2}(T\d{2}(:\d{2}(:\d{2}(\.\d+)?)?)?)?)?)?(Z|[-+](\d{2}(:\d{2})?|\d{4}))?$/

const parseDate = s => {
  if (!s) {
    return false
  }
  if (!dateMatcher.test(s)) {
    throw new Error(`Invalid date format: ${s}. Use ISO 8601 format like 2023-09-04T22:15:00`)
  }
  try {
    const date = new Date(s).toISOString()
    log.trace(`Parsed date ${s} to ${date}`)
    return date
  } catch (e) {
    throw new Error(`Faild to parse date: ${s}: ${e}`)
  }
}

export const getMetadataEntries = async (databaseFile, eventsFile, changesAfter) => {
  const events = await readEventsFile(eventsFile)
  if (!events?.data?.length) {
    log.debug(`No events found for meta data export`)
    return []
  }

  const database = await readDatabaseFile(databaseFile)

  const t0 = Date.now()
  log.trace(`Applying ${events.data.length} events to ${database?.data.length} database entries`)
  let entries = applyEvents(database.data, events.data)
  log.debug(t0, `Applied ${events.data.length} events to ${entries.length} database entries`)
  
  const changesAfterDate = parseDate(changesAfter)
  if (changesAfterDate) {
    entries = entries.filter(entry => changesAfterDate <= entry.updated)
    log.debug(`Found ${entries.length} database entries with changes after ${changesAfterDate}`)
  }
  return entries.map(entry => ({...entry, toString: entryToString}))
}

