const buildDatabase = require('./build');
const { writeDatabase, writeDatabasePlain } = require('./write-database');
const readDatabase = require('./read-database');

module.exports = { buildDatabase, writeDatabase, writeDatabasePlain, readDatabase };
