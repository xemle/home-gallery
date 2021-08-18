const { applyEvents } = require('@home-gallery/events')

const applyEventsFacade = (entries, events) => {
  const entryMap = new Map()
  entries.forEach(entry => entryMap.set(entry.id, entry))
  return applyEvents(entryMap, events)
}

module.exports = {
  applyEvents: applyEventsFacade
}