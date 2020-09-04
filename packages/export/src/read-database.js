const debug = require('debug')('export:database');

const { readDatabase } = require('@home-gallery/database');

const read = (databaseFilename, cb) => {
  const t0 = Date.now();
  readDatabase(databaseFilename, (err, database) => {
    if (err) {
      debug(`Loading database ${databaseFilename} failed: ${err}`);
      return cb(err);
    }
    debug(`Read database file ${databaseFilename} with ${database.data.length} entries in ${Date.now() - t0}ms`);
    cb(null, database);
  })
}

module.exports = read;
