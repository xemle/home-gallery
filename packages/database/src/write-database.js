const { writeJsonGzip, writeSafe } = require('@home-gallery/common');

const wrapEntries = (entries) => {
  return {
    type: 'home-gallery/database@1.0',
    created: new Date().toISOString(),
    data: entries
  }
}

const writeDatabase = (filename, entries, cb) => {
  const database = wrapEntries(entries);

  writeJsonGzip(filename, database, cb);
}

const writeDatabasePlain = (filename, entries, cb) => {
  const database = wrapEntries(entries);
  const data = JSON.stringify(database);
  writeSafe(filename, data, cb);
}

module.exports = { writeDatabase, writeDatabasePlain } ;