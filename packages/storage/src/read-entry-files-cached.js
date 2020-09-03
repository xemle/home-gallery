const path = require('path');
const debug = require('debug')('extract:meta');

const readEntryFilesSingle = require('./read-entry-files');
const { getEntryFilesCacheKey, getEntryFilesCacheFilename } = require('./entry-files-cache-file');
const { readEntryFilesCache } = require('./entry-files-cache');
const { lruCache } = require('@home-gallery/common');

function createCache(storageDir) {
  const loadCache = (entry, cb) => {
    const cacheFilename = getEntryFilesCacheFilename(entry);
    readEntryFilesCache(path.join(storageDir, cacheFilename), cb);
  }

  return lruCache(getEntryFilesCacheKey, loadCache, 20);
}

function readEntryFilesCached(storageDir) {
  const cache = createCache(storageDir);
  const clearCache = () => cache.clear();

  const readEntryFiles = (entry, cb) => {
    cache.getItem(entry, (err, data) => {
      if (data && data.entries[entry.sha1sum]) {
        const filesAndMeta = data.entries[entry.sha1sum];
        return cb(null, filesAndMeta);
      }

      if (err && err.code === 'ENOENT') {
        debug(`Entry files cache for ${entry} is missing. Read files and meta from storage`);
      } else if (err) {
        debug(`Could not read entry files cache for ${entry}: ${err}. Read files and meta from storage`);
      }

      readEntryFilesSingle(entry, storageDir, (err, filesAndMeta) => {
        if (err) {
          debug(`Could not read files and metadata of ${entry}: ${err}`);
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

module.exports = readEntryFilesCached;
