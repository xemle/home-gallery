const fs = require('fs');

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

  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, database, err => {
    if (err) {
      return cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : database));
  });
}

const writeDatabasePlain = (filename, entries, cb) => {
  const database = wrapEntries(entries);
  const data = JSON.stringify(database);

  const tmp = `${filename}.tmp`;
  writeSafe(tmp, data, err => {
    if (err) {
      return cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : database));
  });
}

module.exports = { writeDatabase, writeDatabasePlain } ;
