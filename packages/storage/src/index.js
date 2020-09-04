const getStoragePaths = require('./storage-path');
const writeStorageFile = require('./write-storage-file');
const { getEntryFilesCacheKey, getEntryFilesCacheFilename }= require('./entry-files-cache-file');
const { updateEntryFilesCache }= require('./entry-files-cache');
const readStorageFile = require('./read-storage-file');
const readEntryFiles = require('./read-entry-files');
const readEntryFilesCached = require('./read-entry-files-cached');

module.exports = {
  readEntryFiles,
  readEntryFilesCached,
  getStoragePaths,
  writeStorageFile,
  getEntryFilesCacheKey,
  getEntryFilesCacheFilename,
  updateEntryFilesCache,
  readStorageFile
}