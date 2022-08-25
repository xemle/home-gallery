const { HeaderType, isDatabaseTypeCompatible, readDatabase, readOrCreateDatabase, writeDatabase, writeDatabasePlain } = require('./database')
const buildDatabase = require('./build');
const { mergeEntries } = require('./merge/merge-entry')

module.exports = {
  buildDatabase,
  HeaderType,
  isDatabaseTypeCompatible,
  mergeEntries,
  readDatabase,
  readOrCreateDatabase,
  writeDatabase,
  writeDatabasePlain
};
