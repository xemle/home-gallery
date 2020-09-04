const fs = require('fs');
const debug = require('debug')('server:api:database:read');

const { readDatabase } = require('@home-gallery/database');

function read(filename, cb) {
  const t0 = Date.now();
  readDatabase(filename, (err, database) => {
    if (err) {
      return cb(err);
    }
    debug(`Read database file ${filename} with ${database.data.length} entries in ${Date.now() - t0}ms`);
    cb(err, database);
  });
}

function watch(filename, cb) {
  fs.watch(filename, () => {
    setTimeout(() => {
      debug(`Database file ${filename} changed. Re-import it`);
      read(filename, cb);
    }, 250);
  })
}

function readWatch(filename, cb) {
  read(filename, (err, data) => {
    if (err) {
      return cb(err);
    }
    cb(null, data);
    watch(filename, cb);
  });
}

module.exports = { readWatchDatabase: readWatch, readDatabase: read };
