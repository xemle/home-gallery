const path = require('path');
const debug = require('debug')('index:update');

const mergeIndex = require('./merge');

const createEntryMap = (entries) => {
  return entries.reduce((map, entry) => {
    if (!entry || !entry.filename) {
      console.log(`Failed`);
    }
    map[entry.filename] = entry;
    return map;
  }, {})
}

const byDirName = (a, b) => {
  const aDirs = a.split(path.sep);
  const bDirs = b.split(path.sep);

  let i = 0;
  let max = Math.min(aDirs.length, bDirs.length);
  while (i < max) {
    if (aDirs[i] < bDirs[i]) {
      return -1;
    } else if (aDirs[i] > bDirs[i]) {
      return 1;
    }
    i++;
  }
  
  if (aDirs.length > max) {
    return -1;
  } else if (bDirs.length > max) {
    return 1;
  }

  return 0;
}

const updateIndex = (fileEntries, fsEntries, cb) => {
  const t0 = Date.now();
  if (!fileEntries.length) {
    debug(`Initiate index with ${fsEntries.length} entries`);
    return cb(null, fsEntries, true);
  }

  const fileEntryMap = createEntryMap(fileEntries);
  const fsEntryMap = createEntryMap(fsEntries);
  const fileKeys = Object.keys(fileEntryMap);
  const fsKeys = Object.keys(fsEntryMap);

  const onlyFileKeys = fileKeys.filter(key => !fsEntryMap[key]);
  const onlyFsKeys = fsKeys.filter(key => !fileEntryMap[key]);
  const commonKeys = fileKeys.filter(key => fsEntryMap[key]);

  const { commonEntryMap, changedKeys } = mergeIndex(fileEntryMap, fsEntryMap, commonKeys);

  if (!onlyFileKeys.length && !onlyFsKeys.length && !changedKeys.length) {
    debug(`No changes found in ${Date.now() - t0}ms`);
    return cb(null, fileEntries, false);
  }

  const updatedEntryKeys = commonKeys.concat(onlyFsKeys);
  updatedEntryKeys.sort(byDirName);

  const updatedEntries = updatedEntryKeys.map(key => commonEntryMap[key] || fsEntryMap[key]);

  debug(`Index merged of ${updatedEntryKeys.length} entries (${onlyFsKeys.length} added, ${changedKeys.length} changed, ${onlyFileKeys.length} deleted) in ${Date.now() - t0}ms.`)
  debug(`Changes:\n\t${onlyFsKeys.map(f => `A ${f}`).concat(changedKeys.map(f => `C ${f}`)).concat(onlyFileKeys.map(f => `D ${f}`)).join('\n\t')}`)
  cb(null, updatedEntries, true);
}

module.exports = updateIndex;
