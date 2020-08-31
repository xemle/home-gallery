const debug = require('debug')('index:merge');

const matcherFns = {
  size: (fileEntry, fsEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType) {
      return true;
    }
    return false;
  },
  'size-ctime': (fileEntry, fsEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType &&
      fileEntry.ctimeMs === fsEntry.ctimeMs) {
      return true;
    }
    return false;
  },
  'size-ctime-inode': (fileEntry, fsEntry) => {
    if (fileEntry.size === fsEntry.size &&
      fileEntry.fileType === fsEntry.fileType &&
      fileEntry.ctimeMs === fsEntry.ctimeMs &&
      fileEntry.ino === fsEntry.ino) {
      return true;
    }
    return false;
  }
}

const mergeIndex = (fileEntryMap, fsEntryMap, commonKeys, matcherFn) => {
  const t0 = Date.now();
  let changedKeys = [];
  
  const commonEntries = commonKeys.map(key => {
    const fileEntry = fileEntryMap[key];
    const fsEntry = fsEntryMap[key];

    if (matcherFn(fileEntry, fsEntry)) {
      return fileEntry;
    } else {
      changedKeys.push(key);
      return fsEntry;
    }
  })
  
  const commonEntryMap = commonEntries.reduce((entryMap, entry) => {
    entryMap[entry.filename] = entry;
    return entryMap;
  }, {});

  debug(`Merged ${commonKeys.length} entries in ${Date.now() - t0}ms`);
  return {commonEntryMap, changedKeys};
}

module.exports = {
  mergeIndex,
  matcherFns
};
