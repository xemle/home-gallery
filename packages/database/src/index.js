const { HeaderType, isDatabaseTypeCompatible, readDatabase, readOrCreateDatabase, writeDatabase, writeDatabasePlain, migrate } = require('./database')
const buildDatabase = require('./build');
const { mergeEntries } = require('./merge/merge-entry')

module.exports = {
  buildDatabase,
  HeaderType,
  isDatabaseTypeCompatible,
  mergeEntries,
  readDatabase,
  readOrCreateDatabase,
  migrate,
  writeDatabase,
  writeDatabasePlain
};
