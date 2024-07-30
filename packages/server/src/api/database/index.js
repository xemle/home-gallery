import Logger from '@home-gallery/logger'

import { applyEvents } from './events-facade.js'
import { waitReadWatch } from './read-database.js';
import { cache } from './cache-middleware.js';
import { sanitizeInt } from './sanitize.js';
import { sendError } from '../error/index.js'
import { createQueryContext } from './queryContext.js'

const log = Logger('server.api.database');

/**
 * @param {EventBus} eventbus
 */
export function databaseApi(context, databaseFilename, getEvents) {
  const { eventbus, pluginManager } = context
  let database = false;
  const databaseCache = cache(3600);
  let entryCache = {};

  const filterDatabase = async (database, term = '', req = {}) => {
    /** @type {import('@home-gallery/types').TQueryContext} */
    const queryContext = createQueryContext(context, req)
    const data = await pluginManager.executeQuery(database.data, term, queryContext)
    log.trace({ast: queryContext.ast, queryAst: queryContext.queryAst}, `Queried database with ${queryContext.stringifiedQueryAst}`)
    return {...database, data}
  }

  function send(req, res) {
    if (!database) {
      log.info(`Database file is not loaded yet.`);
      return sendError(res, 404, 'Database file is not loaded yet.')
    }
    filterDatabase(database, req.query?.q || '', req)
      .then(database => {
        if (!req.query?.offset && !req.query?.limit) {
          return res.send(database)
        }
        const length = database.data.length;
        const offset = sanitizeInt(req.query.offset, 0, length, 0);
        const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length);
        const data = database.data.slice(offset, offset + limit);
        res.send({type: database.type, limit, offset, ...database, data });
      })
      .catch(err => {
        log.error(err, `Failed to filter database with query '${req.query?.q}': ${err}`)
        return sendError(res, 400, `Failed to filter database with query '${req.query?.q}': ${err}`)
      })
  }

  const clearCaches = (entries = []) => {
    databaseCache.clear();
    entryCache = {};
    log.trace(`Cleared caches`);
  }

  eventbus.on('userAction', event => {
    if (!database.data.length) {
      log.warn(`Received a user action event without a database. Skip event merging for database`);
      return
    }
    const changedEntries = applyEvents(database, [event])
    if (!changedEntries.length) {
      log.debug(`Event did not change current database`);
      return
    }
    log.debug(`Applied user action event to ${changedEntries.length} database entries`);
    clearCaches(changedEntries)
    eventbus.emit('database', {
      action: 'updateEntries',
      entries: changedEntries
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
          return
        }
        clearCaches()
        filterDatabase(newDatabase, '', {})
          .then(filteredDatabase => {
            if (filteredDatabase.data.length != newDatabase.data.length) {
              log.info(`New database entries are filtered from ${newDatabase.data.length} to ${filteredDatabase.data.length} entries`)
            }
            database = filteredDatabase;
            eventbus.emit('server', {
              action: 'databaseReloaded'
            })
          })
      })
    },
    getFirstEntries: (count) => {
      const key = `firstEntries:${count}`;
      if (typeof entryCache[key] === 'undefined') {
        entryCache[key] = database ? database.data.slice(0, count) : [];
      }
      return entryCache[key]
    },
    read: (req, res) => databaseCache.middleware(req, res, () => send(req, res)),
    getDatabase: () => database
  }
}
