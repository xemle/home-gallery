import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('storage.cache.readEntryFiles');

import { readEntryFiles as readEntryFilesSingle } from './read-entry-files.js';
import { getEntryFilesCacheKey, getEntryFilesCacheFilename } from './entry-files-cache-file.js';
import { readEntryFilesCache } from './entry-files-cache.js';
import { lruCache } from '@home-gallery/common';

function createCache(storageDir, dirCacheSize) {
  const loadCache = (entry, cb) => {
    const cacheFilename = getEntryFilesCacheFilename(entry);
    readEntryFilesCache(path.join(storageDir, cacheFilename), cb);
  }

  return lruCache(getEntryFilesCacheKey, loadCache, dirCacheSize);
}

export function readEntryFilesCached(storageDir, dirCacheSize) {
  const cache = createCache(storageDir, dirCacheSize || 8);
  const clearCache = () => cache.clear();

  const readEntryFiles = (entry, cb) => {
    cache.getItem(entry, (err, data) => {
      if (data && data.entries[entry.sha1sum]) {
        const filesAndMeta = data.entries[entry.sha1sum];
        return cb(null, filesAndMeta);
      }

      if (err && err.code === 'ENOENT') {
        log.warn(`Entry files cache for ${entry} is missing. Read files and meta from storage`);
      } else if (err) {
        log.warn(err, `Could not read entry files cache for ${entry}: ${err}. Read files and meta from storage`);
      }

      readEntryFilesSingle(entry, storageDir, (err, filesAndMeta) => {
        if (err) {
          log.error(err, `Could not read files and metadata of ${entry}: ${err}`);
          return cb(err);
        }
        cb(null, filesAndMeta);
      });
    });
  };

  return {
    readEntryFiles,
    clearCache,
  }
}
