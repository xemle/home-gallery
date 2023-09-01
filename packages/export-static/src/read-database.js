const log = require('@home-gallery/logger')('export.database.read');
const { readDatabase } = require('@home-gallery/database');

const read = (databaseFilename, cb) => {
  const t0 = Date.now();
  readDatabase(databaseFilename, (err, database) => {
    if (err) {
      log.info(`Loading database ${databaseFilename} failed: ${err}`);
      return cb(err);
    }
    log.info(t0, `Read database file ${databaseFilename} with ${database.data.length} entries`);
    cb(null, database);
  })
}

module.exports = read;
