const debug = require('debug')('server:api:database');

const { readWatchDatabase } = require('./read-database');
const { cache } = require('./cache-middleware');
const { sanitizeInt } = require('./sanitize');

function uniqEntries(entries) {
  // unify media entries
  const idToEntry = entries.reduce((result, entry) => {
    if (!result[entry.id]) {
      result[entry.id] = entry;
    }
    return result;
  }, Object.create({}));
  const uniqEntries = Object.values(idToEntry);
  uniqEntries.sort((a, b) => a.date < b.date ? 1 : -1);
  return uniqEntries;
}

function databaseApi() {
  let database = { data: [] };
  const databaseCache = cache(3600);

  function send(req, res) {
    if (req.query && (req.query.offset || req.query.limit)) {
      const length = database.data.length;
      const offset = sanitizeInt(req.query.offset, 0, length, 0);
      const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length);
      const data = database.data.slice(offset, offset + limit);
      res.send(Object.assign({}, database, { limit, offset, data }));
    } else {
      res.send(database);
    }
  }

  const once = (fn) => {
    let called = false;
    return (err, data) => {
      if (!called) {
        called = true;
        fn(err, data);
      }
    }
  }

  return {
    init: (databaseFilename, cb) => {
      const onceCb = once(cb);
      readWatchDatabase(databaseFilename, (err, newDatabase) => {
        if (err) {
          debug(`Could not read database file ${databaseFilename}: ${err}`);
          onceCb(err);
        } else {
          newDatabase.data = uniqEntries(newDatabase.data)
          database = newDatabase;
          databaseCache.clear();
          onceCb();
        }
      })
    },
    read: (req, res) => databaseCache.middleware(req, res, () => send(req, res))
  }
}

module.exports = databaseApi;
