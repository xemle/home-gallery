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

const exists = (filename, cb) => {
  fs.stat(filename, err => {
    if (err && err.code == 'ENOENT') {
      cb(null, false);
    } else if (err) {
      cb(err);
    } else {
      cb(null, true);
    }
  })
}

const wait = (filename, delay, cb) => {
  exists(filename, (err, hasFile) => {
    if (err) {
      return cb(err);
    } else if (!hasFile) {
      return setTimeout(() => wait(filename, delay, cb), delay)
    } else {
      return cb(null);
    }
  })
}

function waitReadWatch(filename, cb) {
  const next = () => {
    read(filename, (err, data) => {
      if (err) {
        return cb(err);
      }
      cb(null, data);
      watch(filename, cb);
    });
  }

  exists(filename, (err, hasFile) => {
    if (err) {
      return cb(err);
    } else if (!hasFile) {
      console.log(`Database file ${filename} does not exists. Waiting for the database file...`)
      wait(filename, 10 * 1000, err => {
        if (err) {
          return cb(err);
        }
        console.log(`Database file ${filename} exists now. Continue`);
        next();
      });
    } else {
      next();
    }
  })
}

module.exports = { waitReadWatch, read };
