import Logger from '@home-gallery/logger'

const log = Logger('index.merge');

export const mergeIndex = (fileEntryMap, fsEntryMap, commonKeys, matcherFn) => {
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

  log.info(t0, `Merged ${commonKeys.length} entries`);
  return {commonEntryMap, changedKeys};
}
