const { HeaderType, isDatabaseTypeCompatible } = require('./header')
const buildDatabase = require('./build');
const { writeDatabase, writeDatabasePlain } = require('./write-database');
const { readDatabase, readOrCreateDatabase } = require('./read-database');
const { mergeEntries } = require('./merge-entry')

module.exports = { readDatabase, readOrCreateDatabase, buildDatabase, writeDatabase, writeDatabasePlain, mergeEntries, HeaderType, isDatabaseTypeCompatible };
