const { applyEvents: applyEventsOrig } = require('@home-gallery/events')
const { createHash, serialize } = require('@home-gallery/common')

const applyEvents = (database, events) => {
  const changedEntries = applyEventsOrig(database.data, events)
  changedEntries.forEach(entry => {
    entry.hash = createHash(serialize(entry, ['hash', 'appliedEventIds']))
  })
  return changedEntries
}

module.exports = {
  applyEvents
}
