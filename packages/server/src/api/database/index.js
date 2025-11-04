import Logger from '@home-gallery/logger'
import { applyEvents } from './events-facade.js'
import { waitReadWatch } from './read-database.js'
import { cache } from './cache-middleware.js'
import { sanitizeInt } from './sanitize.js'
import { sendError } from '../error/index.js'
import { createQueryContext } from './queryContext.js'
import { initRemoteSources, remoteDb } from '../../remote-source.js'

const log = Logger('server.api.database')

export async function databaseApi(context) {
  const { config, eventbus, router, events: { read: getEvents }, executeQuery } = context
  const databaseFilename = config.database.file
  let database = false
  const databaseCache = cache(3600)
  let entryCache = {}

const mergeDatabases = (localDb, remoteDbs, remoteConfig) => {
  log.info(`Merging local DB (${localDb.data.length} entries) with ${Object.keys(remoteDbs).length} remote sources`)

  const merged = {
    ...localDb,
    data: [
      ...(localDb?.data || []),
      ...Object.entries(remoteDbs || {}).flatMap(([sourceName, r]) => {
        const conf = remoteConfig.find(c => c.name === sourceName)
        if (!conf) throw new Error(`No remote config found for source ${sourceName}`)

        log.info(`Processing remote source: ${sourceName} with ${r.data.length} entries`)
        const baseUrl = conf.url.replace(/\/$/, '')
        const proxy = conf.proxy
        const sourceHash = sourceName.slice(0, 8)

        return r.data.map(entry => {
          log.debug(`Processing remote entry: ${entry.id}`)

          const files = entry.files.map(f => ({
            ...f,
            url: proxy
              ? `remote/${sourceHash}/${f.filename}`.replace(/^\/+/, '')
              : `${baseUrl}/${f.filename}`
          }))

          const previews = entry.previews.map(p =>
            proxy
              ? `remote/${sourceHash}/${p}`.replace(/^\/+/, '')
              : `${baseUrl}/${p}`
          )

          log.debug(`Merged remote entry: ${entry.id} from source ${sourceName}`)
          return { ...entry, files, previews }
        })
      })
    ]
  }

  log.info(`Merged database contains total ${merged.data.length} entries`)
  return merged
}





  const filterDatabase = async (db, term = '', req = {}) => {
    const queryContext = createQueryContext(context, req)
    const data = await executeQuery(db.data, term, queryContext)
    log.trace({ast: queryContext.ast, queryAst: queryContext.queryAst}, `Queried database with ${queryContext.stringifiedQueryAst}`)
    log.debug(`filterDatabase() result count: ${data.length} entries`)
    return { ...db, data }
  }

  const clearCaches = (entries = []) => {
    databaseCache.clear()
    entryCache = {}
    log.trace('Cleared caches')
  }

  eventbus.on('userAction', event => {
    if (!database?.data?.length) return
    const changedEntries = applyEvents(database, [event])
    if (!changedEntries.length) return
    log.debug(`Applied user action event to ${changedEntries.length} database entries`)
    clearCaches(changedEntries)
    eventbus.emit('database', { action: 'updateEntries', entries: changedEntries })
  })

  // --- Watch local DB and refetch remote sources each time ---
  waitReadWatch(databaseFilename, getEvents, async (err, newDatabase) => {
    if (err) {
      log.error(err, `Could not read database file ${databaseFilename}: ${err}`)
      return
    }
    clearCaches()
    log.info(`Local database loaded with ${newDatabase.data.length} entries`)

    // REFETCH REMOTE SOURCES
    log.info('Fetching remote sources...')
    await initRemoteSources(config)
    const currentRemoteDbs = remoteDb

    const merged = mergeDatabases(newDatabase, currentRemoteDbs, config.remoteSources)


    filterDatabase(merged, '', {})
      .then(filtered => {
        database = filtered
        log.info(`Database updated with merged remote entries. Total: ${database.data.length}`)
        eventbus.emit('server', { action: 'databaseReloaded' })
      })
      .catch(err => {
        log.error(err, `Failed to filter merged database: ${err}`)
      })
  })

  // --- Inject merged database into context for all viewers ---
  context.database = {
    async getFirstEntries(count, req) {
      const key = `firstEntries:${req.username || ''}:${count}` + Date.now()
      if (!database?.data?.length) return []
      if (entryCache[key]?.length) return entryCache[key]

      return filterDatabase(database, '', req)
        .then(filtered => {
          entryCache[key] = filtered.data.slice(0, count)
          return entryCache[key]
        })
        .catch(err => {
          log.warn(err, 'Failed to query database for first entries. Return empty list')
          return []
        })
    },
    read() {
      return database
    },
    filterDatabase(term, req) {
      return filterDatabase(database, term, req)
    }
  }

  // Optional API endpoint
  router.get('/api/database.json', (req, res) => {
    databaseCache.middleware(req, res, () => {
      if (!database) return sendError(res, 404, 'Database not loaded yet')
      filterDatabase(database, req.query?.q || '', req)
        .then(db => {
          if (!req.query?.offset && !req.query?.limit) return res.send(db)
          const length = db.data.length
          const offset = sanitizeInt(req.query.offset, 0, length, 0)
          const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length)
          const data = db.data.slice(offset, offset + limit)
          res.send({ type: db.type, limit, offset, ...db, data })
        })
        .catch(err => {
          log.error(err, `Failed to filter database for API: ${err}`)
          sendError(res, 400, `Failed to filter database for API: ${err}`)
        })
    })
  })
}
