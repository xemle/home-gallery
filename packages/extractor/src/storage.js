const path = require('path');
const { getStoragePaths, readStorageFile, writeStorageFile } = require('@home-gallery/storage');

const createStorage = (storageDir) => {

  const buildEntryFile = (entry, suffix) => {
    const {dir, prefix} = getStoragePaths(entry.sha1sum);
    return path.join(dir, `${prefix}-${suffix}`);
  }

  return {
    hasEntryFile: (entry, suffix) => {
      const entryFile = buildEntryFile(entry, suffix);
      return entry.files.indexOf(entryFile) >= 0;
    },
    getEntryDirname: (entry) => {
      const {dir} = getStoragePaths(entry.sha1sum);
      return path.join(storageDir, dir);
    },
    getEntryBasename: (entry, suffix) => {
      const {prefix} = getStoragePaths(entry.sha1sum);
      return `${prefix}-${suffix}`;
    },
    getEntryFilename: (entry, suffix) => {
      const filename = buildEntryFile(entry, suffix);
      return path.join(storageDir, filename);
    },
    addEntryFilename: (entry, suffix) => {
      const filename = buildEntryFile(entry, suffix);
      entry.files.push(filename);
    },
    addEntryBasename: (entry, basename) => {
      const {dir} = getStoragePaths(entry.sha1sum);
      const filename = path.join(dir, basename);
      entry.files.push(filename);
    },
    readEntryFile: (entry, suffix, cb) => {
      const filename = buildEntryFile(entry, suffix);
      readStorageFile(storageDir, filename, cb);
    },
    writeEntryFile: (entry, suffix, data, cb) => {
      const filename = buildEntryFile(entry, suffix);
      writeStorageFile(entry, storageDir, filename, data, cb);
    },
  }
}

module.exports = {
  createStorage
}