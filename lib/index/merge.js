const debug = require('debug')('index:merge');

const matchEntry = (fileEntry, fsEntry) => {
  if (fileEntry.size === fsEntry.size &&
    fileEntry.ino === fsEntry.ino &&
    fileEntry.dev === fsEntry.dev &&
    fileEntry.ctime === fsEntry.ctime &&
    fileEntry.fileType === fsEntry.fileType) {
    return true
  }
  return false;
}

const mergeIndex = (fileEntryMap, fsEntryMap, commonKeys) => {
  const t0 = Date.now();
  let changedKeys = [];
  
  const commonEntries = commonKeys.map(key => {
    const fileEntry = fileEntryMap[key];
    const fsEntry = fsEntryMap[key];

    if (matchEntry(fileEntry, fsEntry)) {
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

module.exports = mergeIndex;
