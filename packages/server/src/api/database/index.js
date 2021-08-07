const log = require('@home-gallery/logger')('server.api.database');

const { waitReadWatch } = require('./read-database');
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

function databaseApi(eventbus) {
  let database = false;
  const databaseCache = cache(3600);
  let entryCache = {};

  function send(req, res) {
    if (!database) {
      log.info(`Database file is not loaded yet.`);
      const err = {
        error: {
          code: 404,
          message: 'Database file is not loaded yet.'
        }
      }
      return res.status(404).json(err);
    } else if (req.query && (req.query.offset || req.query.limit)) {
      const length = database.data.length;
      const offset = sanitizeInt(req.query.offset, 0, length, 0);
      const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length);
      const data = database.data.slice(offset, offset + limit);
      res.send(Object.assign({}, database, { limit, offset, data }));
    } else {
      res.send(database);
    }
  }

  return {
    init: (databaseFilename) => {
      waitReadWatch(databaseFilename, (err, newDatabase) => {
        if (err) {
          log.error(`Could not read database file ${databaseFilename}: ${err}`);
        } else {
          newDatabase.data = uniqEntries(newDatabase.data)
          database = newDatabase;
          databaseCache.clear();
          entryCache = {};
          eventbus.emit(eventbus.create('server', {
            action: 'databaseReloaded'
          }))
        }
      })
    },
    getFirstEntries: (count) => {
      const key = `firstEntries:${count}`;
      if (typeof entryCache[key] === 'undefined') {
        entryCache[key] = database ? database.data.slice(0, count) : [];
      }
      return entryCache[key]
    },
    read: (req, res) => databaseCache.middleware(req, res, () => send(req, res))
  }
}

module.exports = databaseApi;
