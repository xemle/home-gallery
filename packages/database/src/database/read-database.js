const { readJsonGzip } = require('@home-gallery/common');

const { HeaderType, isDatabaseTypeCompatible } = require('./header')

function readDatabase(filename, cb) {
  readJsonGzip(filename, (err, database) => {
    if (err) {
      return cb(err);
    } else if (!isDatabaseTypeCompatible(database && database.type)) {
      return cb(new Error(`Incompatible database format ${database && database.type || 'unknown'} of file ${filename}. Expect ${HeaderType}`))
    }
    cb(null, database);
  });
}

const initDatabase = (entries) => {
  return {
    type: HeaderType,
    created: new Date().toISOString(),
    data: entries
  }
}

const readOrCreateDatabase = (filename, cb) => {
  readDatabase(filename, (err, database) => {
    if (err && err.code == 'ENOENT') {
      cb(null, initDatabase([]))
    } else {
      cb(err, database)
    }
  })
}

module.exports = {
  initDatabase,
  readDatabase,
  readOrCreateDatabase
};