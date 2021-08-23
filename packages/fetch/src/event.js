const log = require('@home-gallery/logger')('api.events')

const { mergeEvents } = require('@home-gallery/events/dist/node')

const { fetchEvents } = require('./api')

const handleEvents = async (serverUrl, eventFile, { insecure }) => {
  const t0 = Date.now()
  const remoteEvents = await fetchEvents(serverUrl, { insecure })
  if (!remoteEvents.data.length) {
    log.info(t0, `Remote has no events. Skip event merge`)
    return
  }
  const newEvents = await mergeEvents(eventFile, remoteEvents.data)
  log.info(t0, `Merged ${newEvents.length} events to ${eventFile}`)
}

module.exports = {
  handleEvents
}