const fs = require('fs');
const log = require('@home-gallery/logger')('server.api.database.read');

const { readDatabase } = require('@home-gallery/database');
const { applyEvents } = require('@home-gallery/events')

function read(filename, cb) {
  const t0 = Date.now();
  readDatabase(filename, (err, database) => {
    if (err) {
      return cb(err);
    }
    log.info(t0, `Read database file ${filename} with ${database.data.length} entries`);
    cb(err, database);
  });
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

const mergeEvents = (database, getEvents, stringifyEntryCache, cb) => {
  getEvents((err, events) => {
    if ((err && err.code == 'ENOENT')) {
      cb(null, database)
    } else if (err) {
      log.warn(err, `Could not read events. Skip merging events to database: ${err}`)
      cb(null, database)
    } else {
      const t0 = Date.now()
      const changedEntries = applyEvents(database.data, events.data)
      stringifyEntryCache.evictEntries(changedEntries)
      log.debug(t0, `Applied ${events.data.length} events to ${changedEntries.length} of ${database.data.length} database entries`)
      cb(null, database)
    }
  })
}

function waitReadWatch(filename, getEvents, stringifyEntryCache, cb) {
  let changeTimer

  const onChange = (cur, prev) => {
    clearTimeout(changeTimer)
    if (cur.size) {
      changeTimer = setTimeout(() => {
        log.info(`Database file ${filename} changed. Re-import it`);
        next()
      }, 250)
    } else if (!cur.size && prev.size) {
      log.warn(`Database file ${filename} was removed. Ignore`);
    }
  }

  const next = () => {
    read(filename, (err, database) => {
      if (err) {
        return cb(err);
      }
      mergeEvents(database, getEvents, stringifyEntryCache, (err, database) => {
        if (err) {
          return cb(err)
        }
        cb(null, database);
      })
    });
  }

  exists(filename, (err, hasFile) => {
    if (err) {
      return cb(err);
    } else if (!hasFile) {
      log.info(`Database file ${filename} does not exists. Waiting for the database file...`)
      wait(filename, 10 * 1000, err => {
        if (err) {
          return cb(err);
        }
        log.info(`Database file ${filename} exists now. Continue`);
        fs.watchFile(filename, onChange)
        next();
      });
    } else {
      fs.watchFile(filename, onChange)
      next();
    }
  })
}

module.exports = { waitReadWatch, read };
