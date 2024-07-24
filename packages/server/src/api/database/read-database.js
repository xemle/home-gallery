import fs from 'fs';
import path from 'path';
import Logger from '@home-gallery/logger'

const log = Logger('server.api.database.read');

import { debounce } from '@home-gallery/common';
import { readDatabaseStreamed } from '@home-gallery/database';
import { applyEvents } from './events-facade.js'

export function read(filename, cb) {
  const t0 = Date.now();
  readDatabaseStreamed(filename)
    .then(database => {
      log.info(t0, `Read database file ${filename} with ${database.data.length} entries`);
      cb(null, database);
    }, cb);
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

const mergeEvents = (database, getEvents, cb) => {
  getEvents((err, events) => {
    if ((err && err.code == 'ENOENT')) {
      cb(null, database)
    } else if (err) {
      log.warn(err, `Could not read events. Skip merging events to database: ${err}`)
      cb(null, database)
    } else {
      const t0 = Date.now()
      const changedEntries = applyEvents(database, events.data)
      log.debug(t0, `Applied ${events.data.length} events to ${changedEntries.length} of ${database.data.length} database entries`)
      cb(null, database)
    }
  })
}

export function waitReadWatch(filename, getEvents, stringifyEntryCache, cb) {
  const onChange = () => {
    exists(filename, (err, hasFile) => {
      if (err) {
        log.warn(err, `File ${filename} changed but could not read it. Ignore`)
      } else if (!hasFile) {
        log.warn(`Database file ${filename} was removed. Ignore`);
      } else {
        log.info(`Database file ${filename} changed. Re-import it`);
        next()
      }
    })
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

  const watch = () => {
    log.debug(`Watch database file ${filename} for changes`);
    const debounceOnChange = debounce(onChange, 1000)

    const watcher = fs.watch(path.dirname(filename), (_, name) => {
      if (name == path.basename(filename)) {
        debounceOnChange()
      }
    });

    process.once('SIGINT', () => {
      log.debug(`Stop watching database file ${filename}`);
      watcher.close();
    })
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
        next();
        watch();
      });
    } else {
      next();
      watch();
    }
  })
}
