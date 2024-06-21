import { applyEvents as applyEventsOrig } from '@home-gallery/events'
import { createHash, serialize } from '@home-gallery/common'

export const applyEvents = (database, events) => {
  const changedEntries = applyEventsOrig(database.data, events)
  changedEntries.forEach(entry => {
    entry.hash = createHash(serialize(entry, ['hash', 'appliedEventIds']))
  })
  return changedEntries
}
