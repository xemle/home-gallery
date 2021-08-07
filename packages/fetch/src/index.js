
const log = require('@home-gallery/logger')('fetch')

const { fetchDatabase } = require('./api')
const { readDatabase, mergeDatabase } = require('./database')
const { handlePreviews } = require('./preview')
const { handleEvents } = require('./event')

const fetch = async (options) => {
  const { serverUrl, databaseFile, storageDir, eventFile } = options;

  const [remoteDatabase, localDatabase] = await Promise.all([
    fetchDatabase(serverUrl),
    readDatabase(databaseFile)
  ])

  await handlePreviews(serverUrl, remoteDatabase, localDatabase, storageDir)
  await handleEvents(serverUrl, eventFile).catch(err => {
    log.warn(`Failed to fetch events: ${err}. Skip events`)
  })
  await mergeDatabase(remoteDatabase, localDatabase, databaseFile)
}

module.exports = {
  fetch
}