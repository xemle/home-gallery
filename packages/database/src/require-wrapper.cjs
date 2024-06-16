const { HeaderType, isDatabaseTypeCompatible } = require('./database/header.cjs')
const { mergeEntries } = require('./merge/merge-entry.cjs')

module.exports = {
  HeaderType,
  isDatabaseTypeCompatible,
  readDatabase(filename, cb) {
    import('./index.js')
      .then(({readDatabase}) => readDatabase(filename, cb), err => cb(err))
  },
  readOrCreateDatabase(filename, cb) {
    import('./index.js')
      .then(({readOrCreateDatabase}) => readOrCreateDatabase(filename, cb), err => cb(err))
  },
  writeDatabase(filename, entries, cb) {
    import('./index.js')
      .then(({writeDatabase}) => writeDatabase(filename, entries, cb), err => cb(err))
  },
  writeDatabasePlain(filename, entries, cb) {
    import('./index.js')
      .then(({writeDatabasePlain}) => writeDatabasePlain(filename, entries, cb), err => cb(err))
  },
  migrate(database, cb) {
    import('./index.js')
      .then(({migrate}) => migrate(database, cb), err => cb(err))
  },
  buildDatabase(options, cb) {
    import('./index.js')
      .then(({buildDatabase}) => buildDatabase(options, cb), err => cb(err))
  },
  mergeEntries
}