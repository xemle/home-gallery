const { importSources, watchSources, extract, buildDatabase } = require('./import-sources')
const { startServer } = require('./server')

module.exports = {
  importSources,
  watchSources,
  extract,
  buildDatabase,
  startServer
}
