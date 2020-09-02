const path = require('path');
const { sha1Hex } = require('@home-gallery/common');
const getStoragePaths = require('./storage-path');

const getEntryFilesCacheKey = (entry) => {
  const { indexName, filename } = entry;
  const dirname = path.dirname(filename);
  return `${indexName}:${dirname}`;
}

const getEntryFilesCacheFilename = (entry) => {
  const cacheKey = getEntryFilesCacheKey(entry);
  const sha1 = sha1Hex(cacheKey);
  const {dir, prefix} = getStoragePaths(sha1);
  return path.join(dir, `${prefix}-meta.cache`);
}

module.exports = { 
  getEntryFilesCacheKey,
  getEntryFilesCacheFilename 
};

