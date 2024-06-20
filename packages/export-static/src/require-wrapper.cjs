module.exports = {
  buildDatabase: (databaseFilename, eventsFilename, query, cb) => {
    import('./index.js')
      .then(({buildDatabase}) => buildDatabase(databaseFilename, eventsFilename, query, cb))
  },
  exportBuilder: (options, cb) => {
    import('./index.js')
      .then(({exportBuilder}) => exportBuilder(options, cb))
  }
}