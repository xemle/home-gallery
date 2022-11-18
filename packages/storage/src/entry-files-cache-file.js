const path = require('path');
const { sha1Hex } = require('@home-gallery/common');
const getStoragePaths = require('./storage-path');

const getEntryFilesCacheKey = (entry) => {
  const { indexName, filename } = entry;
  const dirname = path.dirname(filename);
  return `${indexName}:${dirname}`;
}

const getEntryFilesCacheId = (entry) => {
  const cacheKey = getEntryFilesCacheKey(entry);
  return sha1Hex(cacheKey);
}

const getEntryFilesCacheFilename = (entry) => {
  const cacheId = getEntryFilesCacheId(entry)
  const {dir, prefix} = getStoragePaths(cacheId);
  return path.join(dir, `${prefix}-meta.cache`);
}

module.exports = { 
  getEntryFilesCacheKey,
  getEntryFilesCacheId,
  getEntryFilesCacheFilename 
};

