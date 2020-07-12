const fs = require('fs');
const debug = require('debug')('server:api:database:read');

const { readJsonGzip } = require('@home-gallery/common');

function readDatabase(databaseFilename, cb) {
  readJsonGzip(databaseFilename, (err, data) => {
    if (err) {
      return cb(err);
    }
    debug(`Read database file ${databaseFilename} with ${data.media.length} entries`);
    cb(err, data);
  });
}

function watchDatabase(databaseFilename, cb) {
  fs.watch(databaseFilename, () => {
    setTimeout(() => {
      debug(`Database file ${databaseFilename} changed. Re-import it`);
      readDatabase(databaseFilename, cb);
    }, 250);
  })
}

function readWatchDatabase(databaseFilename, cb) {
  readDatabase(databaseFilename, (err, data) => {
    if (err) {
      return cb(err);
    }
    cb(null, data);
    watchDatabase(databaseFilename, cb);
  });
}

module.exports = { readWatchDatabase, readDatabase };
