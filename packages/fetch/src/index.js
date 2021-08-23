
const log = require('@home-gallery/logger')('fetch')

const { fetchDatabase } = require('./api')
const { readDatabase, mergeDatabase } = require('./database')
const { handlePreviews } = require('./preview')
const { handleEvents } = require('./event')

const fetch = async (options) => {
  const { serverUrl, databaseFile, storageDir, eventFile, insecure } = options;

  const [remoteDatabase, localDatabase] = await Promise.all([
    fetchDatabase(serverUrl, { insecure }),
    readDatabase(databaseFile)
  ])

  await handlePreviews(serverUrl, remoteDatabase, localDatabase, storageDir, { insecure })
  await handleEvents(serverUrl, eventFile, { insecure }).catch(err => {
    log.warn(`Failed to fetch events: ${err}. Skip events`)
  })
  await mergeDatabase(remoteDatabase, localDatabase, databaseFile)
}

module.exports = {
  fetch
}