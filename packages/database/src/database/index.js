const { HeaderType, isDatabaseTypeCompatible } = require('./header')
const { initDatabase, readDatabase, readOrCreateDatabase } = require('./read-database')
const { writeDatabase, writeDatabasePlain } = require('./write-database')

module.exports = {
  HeaderType,
  isDatabaseTypeCompatible,
  initDatabase,
  readDatabase,
  readOrCreateDatabase,
  writeDatabase,
  writeDatabasePlain
}