const path = require('path');
const through2 = require('through2');
const debug = require('debug')('storage:read-meta-cached');

const readStorageFiles = require('./read-storage-files');
const { getMetaCacheKey, getMetaCacheFilename } = require('./meta-cache-key');
const { readMeta } = require('./meta-file');
const { lruCache } = require('@home-gallery/common');

function createCache(storageDir) {
  const loadCache = (entry, cb) => {
    const filename = getMetaCacheFilename(entry);
    const metaFilename = path.join(storageDir, filename);
    readMeta(metaFilename, (err, data) => {
      if (err && err.code === 'ENOENT') {
        debug(`Meta cache for ${entry} is missing`);
        return cb(null, []);
      } else if (err) {
        debug(`Could not read meta cache for ${entry}: ${err}`);
        return cb(null, []);
      }
      cb(null, data.entries);
    });
  }

  return lruCache(getMetaCacheKey, loadCache, 20);
}

function readMetaCached(storageDir) {
  const cache = createCache(storageDir);

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    
    cache.getItem(entry, (err, entries) => {
      const filesAndMeta = entries[entry.sha1sum];
      if (filesAndMeta) {
        that.push({...entry, ...filesAndMeta});
        return cb();
      }
      readStorageFiles(entry, storageDir, (err, filesAndMeta) => {
        if (err) {
          debug(`Could not read files and metadata of ${entry}: ${err}`);
          return cb(err);
        }
        that.push({...entry, ...filesAndMeta});
        cb();
      }); 
    });
  }, function (cb) {
    cache.clear();
    cb();
  });
}

module.exports = readMetaCached;
