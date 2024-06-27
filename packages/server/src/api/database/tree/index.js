import Logger from '@home-gallery/logger'

const log = Logger('server.api.database.tree');

import { FileStore } from './file-store.js'
import { ObjectStore } from './object-store.js';
import { sendError } from '../../error/index.js';

export const treeApi = (eventbus, getDatabase) => {

  /**
   * @type {FileStore}
   */
  let fileStore
  /**
   * @type {ObjectStore}
   */
  let objectStore
  let rootId

  const buckets = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]

  const updateBucketSizes = (sizes, count) => {
    const size = buckets.filter(size => size <= count).pop() || buckets[buckets.length - 1]
    if (!sizes[size]) {
      sizes[size] = 1
    } else {
      sizes[size]++
    }
  }

  const logFileStoreStats = (fileStore) => {
    let dirs = 0
    let files = 0
    const sizes = {}
    fileStore.walk({
      beforeDir(tree) {
        dirs++
        updateBucketSizes(sizes, Object.values(tree.files).length)
        return true
      },
      visitFile() {
        files++
      }
    })
    log.debug({stats: {dirs, files, sizes}}, `File store has ${dirs} dirs and ${files} files`)
  }

  const logObjectStoreStats = (objectStore, rootId) => {
    let trees = 0
    let entries = 0
    const sizes = {}
    objectStore.walk(rootId, {
      beforeTree(_, files) {
        trees++
        updateBucketSizes(sizes, files.length)
        return true
      },
      visitEntry() {
        entries++
      }
    })
    log.debug({stats: {trees, entries, sizes}}, `Object store has ${trees} trees and ${entries} entries`)
  }

  const buildTreeStore = () => {
    const t0 = Date.now()
    const entries = getDatabase()?.data || []
    fileStore = new FileStore()
    fileStore.addEntries(entries)
    logFileStoreStats(fileStore)
    log.debug(t0, `Build file store from ${entries.length} entries`)
  }

  const buildObjectStore = () => {
    log.trace(`Building stores for offline database`)
    if (!fileStore) {
      buildTreeStore()
    }

    const t1 = Date.now()
    objectStore = new ObjectStore()
    rootId = objectStore.addFileStore(fileStore, 8000)
    logObjectStoreStats(objectStore, rootId)
    log.debug(t1, `Build database object store`)
  }

  const clearCaches = () => {
    if (!rootId) {
      return
    }
    fileStore = null
    objectStore = null
    rootId = null
    log.debug(`Clear database tree and object store`)
  }

  const clearObjectStoreCache = () => {
    if (!rootId) {
      return
    }
    objectStore = null
    rootId = null
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
    read: (req, res) => {
      const hashRef = req.params.hash?.replace(/\.json$/i, '')
      if (!rootId) {
        buildObjectStore()
      }
      const hash = hashRef == 'root' ? rootId : hashRef
      if (!hash) {
        return sendError(res, 421, `Tree reference is missing or empty`)
      }
      const data = objectStore.getByHash(hash)
      if (!data) {
        return sendError(res, 404, `Object not found`)
      }
      return res.send({
        type: 'home-gallery/database-tree@1.0',
        hash,
        data
      })
    }
  }
}
