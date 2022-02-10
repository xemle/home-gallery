const log = require('@home-gallery/logger')('server.api.database');

const { filterEntriesByQuery } = require('@home-gallery/query')
const { buildEntriesTextCache } = require('@home-gallery/query')

const { waitReadWatch } = require('./read-database');
const { cache } = require('./cache-middleware');
const { sanitizeInt } = require('./sanitize');
const { applyEvents } = require('./apply-events')

const { sendError } = require('../error')

const filterEntriesByQueryCb = (entries, query, cb) => filterEntriesByQuery(entries, query).then(({entries}) => cb(null, entries)).catch(cb)

const filterDatabase = (entries, query, cb) => query ? filterEntriesByQueryCb(entries, query, cb) : cb(null, entries)

/**
 * @param {EventBus} eventbus
 */
function databaseApi(eventbus, databaseFilename, getEvents) {
  let database = false;
  const databaseCache = cache(3600);
  let entryCache = {};

  function send(req, res) {
    if (!database) {
      log.info(`Database file is not loaded yet.`);
      return sendError(res, 404, 'Database file is not loaded yet.')
    } else if (req.query && (req.query.offset || req.query.limit || req.query.q)) {
      filterDatabase(database.data, req.query.q, (err, entries) => {
        if (err) {
          log.error(err, `Failed to filter database with query '${req.query.q}': ${err}`)
          return sendError(res, 400, `Failed to filter database with query '${req.query.q}': ${err}`)
        }
        const length = entries.length;
        const offset = sanitizeInt(req.query.offset, 0, length, 0);
        const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length);
        const data = entries.slice(offset, offset + limit);
        res.send(Object.assign({}, database, { limit, offset, data }));
      })
    } else {
      res.send(database);
    }
  }

  const clearCaches = () => {
    databaseCache.clear();
    entryCache = {};
    log.trace(`Cleared caches`);
  }

  eventbus.on('userAction', event => {
    if (!database.data.length) {
      log.warn(`Received a user action event without a database. Skip event merging for database`);
      return
    }
    const changedEntries = applyEvents(database.data, [event])
    if (!changedEntries.length) {
      log.debug(`Event did not change current database`);
      return
    }
    buildEntriesTextCache(changedEntries)
    log.debug(`Applied user action event to ${changedEntries.length} database entries`);
    clearCaches()
    eventbus.emit('server', {
      action: 'databaseUpdated'
    })

  })

  return {
    /**
     * @param {string} databaseFilename
     */
    init: () => {
      waitReadWatch(databaseFilename, getEvents, (err, newDatabase) => {
        if (err) {
          log.error(`Could not read database file ${databaseFilename}: ${err}`);
        } else {
          database = newDatabase;
          clearCaches()
          eventbus.emit('server', {
            action: 'databaseReloaded'
          })
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
