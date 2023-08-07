const { importSources, watchSources, extract, createDatabase } = require('./import-sources')
const { startServer } = require('./server')

module.exports = {
  importSources,
  watchSources,
  extract,
  createDatabase,
  startServer
}
