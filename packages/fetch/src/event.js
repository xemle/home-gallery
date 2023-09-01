const log = require('@home-gallery/logger')('api.events')

const { applyEvents, mergeEvents } = require('@home-gallery/events')

const applyEventsFacade = (database, events) => {
  if (!events.data.length) {
    log.debug(`Events are empty. Skip apply events`)
  }
  const t0 = Date.now()
  const changedEntries = applyEvents(database.data, events.data)
  log.debug(t0, `Applied ${events.data.length} events to ${database.data.length} database entries and updated ${changedEntries.length} entries`)
  return database
}

const handleEvents = async (remoteEvents, eventFile) => {
  const t0 = Date.now()
  if (!remoteEvents.data.length) {
    log.info(t0, `Remote has no events. Skip event merge`)
    return
  }
  const newEvents = await mergeEvents(eventFile, remoteEvents.data)
  log.info(t0, `Merged ${newEvents.length} events to ${eventFile}`)
}

module.exports = {
  applyEvents: applyEventsFacade,
  handleEvents
}