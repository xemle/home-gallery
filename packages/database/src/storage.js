import path from 'path'

import Logger from '@home-gallery/logger'
import { lruCache } from '@home-gallery/common'
import { getMediaCacheFilename, updateMediaCache as storageUpdateMediaCache, readMediaCache as storageReadMediaCache, getMediaCacheId, readEntryFilesCached as storageReadEntryFilesCached} from "@home-gallery/storage"

const log = Logger('database.storage')

/**
 * @typedef Storage
 * @property {function} readEntryFiles
 * @property {function} updateMediaCache
 * @property {function} readMediaCache
 * @property {function} clearCache
 */
/**
 *
 * @param {string} storageDir
 * @param {number} dirCacheSize
 * @returns {Storage}
 */
export const createStorage = (storageDir, dirCacheSize = 12) => {
  const mediaCache = createMediaCache(storageDir, dirCacheSize)
  const entryCache = storageReadEntryFilesCached(storageDir, 2)

  /**
   * @type Storage
   */
  return {
    /**
     * @param {any} entry
     * @param {function} cb
     */
    readEntryFiles(entry, cb) {
      entryCache.readEntryFiles(entry, cb)
    },
    /**
     * Write all media to cache file
     *
     * @param {any[]} media List of media
     * @param {function} cb
     */
    updateMediaCache(media, cb) {
      if (!media.length) {
        return cb(null, media)
      }
      const firstMedia = media[0]
      const cacheFilename = getMediaCacheFilename(firstMedia)
      storageUpdateMediaCache(storageDir, cacheFilename, media, cb)
    },
    /**
     * Read single media from cache
     *
     * @param {any} slimMedia Singe media
     * @param {function} cb Error or media object from cache
     */
    readMediaCache(slimMedia, cb) {
      mediaCache.getItem(slimMedia, (errCause, cache) => {
        if (errCause) {
          return cb(new Error(`Failed to read meadia cache for ${slimMedia}`, {cause: errCause}))
        }

        const {index, filename} = slimMedia.files[0] || {}
        const cacheKey = `${index}:${filename || 'unknownFile'}`
        if (!cache.data[cacheKey]) {
          return cb(new Error(`Media ${slimMedia} not found in cache`))
        }

        cb(null, cache.data[cacheKey])
      })
    },
    clearCache() {
      entryCache.clearCache()
      mediaCache.clear()
    }
  }
}

function createMediaCache(storageDir, dirCacheSize) {
  const loadCache = (slimMedia, cb) => {
    const cacheFilename = getMediaCacheFilename(slimMedia);
    storageReadMediaCache(storageDir, cacheFilename, (errCause, cache) => {
      if (errCause) {
        const e = new Error(`Failed to read media cache file ${cacheFilename} from storage`, {cause: errCause})
        return cb(e)
      }
      cb(null, cache)
    });
  }

  return lruCache(getMediaCacheId, loadCache, dirCacheSize);
}