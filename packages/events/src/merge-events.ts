import { PathLike } from 'fs';
import fs from 'fs/promises';
import { Event } from './models';

import { readEvents } from './read-events.js'
import { writeEvents } from './append-event.js'

import Logger from '@home-gallery/logger'
const log = Logger('events.merge')

type IdMap = {
  [key: string]: Event
}

const byDate = (a: Event, b: Event) => {
  if (a.date && b.date) {
    return a.date < b.date ? -1 : 1
  } else if (a.date) {
    return 1
  } else {
    return -1
  }
}

export const mergeEvents = async (eventsFilename: PathLike, events: Event[]) => {
  if (!events?.length) {
    log.debug(`Given events are empty. Skip merge`)
    return
  }
  const exists = await fs.access(eventsFilename).then(() => true).catch(() => false)
  if (!exists) {
    log.debug(`Event file ${eventsFilename} does not exists, create new event file`)
    await writeEvents(eventsFilename, events)
    return events
  }

  const fileEvents = await readEvents(eventsFilename)

  const ids = fileEvents.data.reduce((result: IdMap, event) => { result[event.id] = event; return result}, {})
  const uniqNewEvents = events.filter(event => !ids[event.id])
  if (!uniqNewEvents.length) {
    log.info(`No new events found. Skip merge`)
    return uniqNewEvents
  }

  const merged = fileEvents.data.concat(uniqNewEvents).sort(byDate)
  await writeEvents(eventsFilename, merged)
  return uniqNewEvents.sort(byDate)
}
