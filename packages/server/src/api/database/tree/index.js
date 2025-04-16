import Logger from '@home-gallery/logger'

import { sendError } from '../../error/index.js';
import { createQueryContext } from '../queryContext.js';
import { ObjectStoreV2, createYearGroupedMonthPathMapper } from './object-store-v2.js';

const log = Logger('server.api.database.tree');

/**
 * @param {import('../../../types.js').TServerContext} context
 */
export const treeApi = (context, getDatabase) => {
  const { config, eventbus, executeQuery } = context
  const treeConfig = config?.server?.api?.tree || {}

  let userStores = {}
  const pathMapper = createYearGroupedMonthPathMapper(treeConfig.monthGroupSize || 3, treeConfig.irgnoreRecentYears || 4)
  const objectStore = new ObjectStoreV2(pathMapper)

  const getStoreId = req => req.username ? 'user:' + req.username : 'all'

  const getEntryFilter = async (req) => {
    const queryContext = createQueryContext(context, req)
    // Execute a dummy query to retreive the queryFilter in the queryContext
    await executeQuery([], '', queryContext)
    log.trace({ast: queryContext.ast, queryAst: queryContext.queryAst}, `Create query filter with ${queryContext.stringifiedQueryAst}`)
    const entryFilter = queryContext.queryFilter || (() => true)
    const entryMapper = queryContext.queryMapper || (e => e)
    return [entryFilter, entryMapper]
  }

  const buildObjectStore = async (req) => {
    const entries = getDatabase()?.data || []
    if (!entries.length) {
      log.debug(`Skip building object store for offline database due empty database`)
      return
    }

    log.trace(`Building object store for offline database`)

    const t1 = Date.now()
    const [entryFilter, entryMapper] = await getEntryFilter(req)
    const storeId = getStoreId(req)

    const rootId = objectStore.addEntries(entries, entryFilter, entryMapper)

    userStores[storeId] = { rootId }
    log.debug(t1, `Build database object store for ${storeId}`)
  }

  const clearCaches = () => {
    if (!Object.keys(userStores).length) {
      return
    }
    objectStore.clear()
    userStores = {}
    log.debug(`Clear database object stores`)
  }

  const clearObjectStoreCache = () => {
    if (!Object.keys(userStores).length) {
      return
    }
    userStores = {}
    log.debug(`Clear database object store`)
  }

  eventbus.on('server', ({action}) => {
    if (action == 'databaseReloaded') {
      clearCaches()
    }
  })

  eventbus.on('database', (event) => {
    if (event?.action == 'updateEntries') {
      clearObjectStoreCache()
    }
  })

  return {
    read: async (req, res) => {
      const hashRef = req.params.hash?.replace(/\.json$/i, '')

      const storeId = getStoreId(req)
      if (!userStores[storeId]?.rootId) {
        await buildObjectStore(req)
      }
      const rootId = userStores[storeId]?.rootId || ''
      const hash = hashRef == 'root' ? rootId : hashRef
      if (!hash) {
        return sendError(res, 421, `Tree reference is missing or empty`)
      }

      const data = objectStore.getByHash(hash)
      if (!data) {
        return sendError(res, 404, `Object not found`)
      }

      res.set('Content-Type', 'application/json')
      return res.send(data)
    }
  }
}
