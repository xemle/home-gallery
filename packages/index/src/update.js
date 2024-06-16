import Logger from '@home-gallery/logger'

const log = Logger('index.update');

import { mergeIndex }  from './merge.js';

const toMap = (values, keyFn) => values.reduce((result, value) => {
  const key = keyFn(value)
  if (!key) {
    log.info(`Could not find key for ${value}`)
  } else {
    result[key] = value
  }
  return result
}, {})

const hasNoChanges = (onlyFileKeys, onlyFsKeys, changedKeys) => !onlyFileKeys.length && !onlyFsKeys.length && !changedKeys.length

const setPrevSha1sum = (keys, fileEntryMap, fsEntryMap) => keys.forEach(key => {
  const fsEntry = fsEntryMap[key]
  const fileEntry = fileEntryMap[key]
  fsEntry.prevSha1sum = fileEntry.sha1sum
})

const initialChanges = entries => {
  return {
    adds: entries,
    changes: [],
    removes: []
  }
}

export const updateIndex = (fileEntries, fsEntries, matcherFn, cb) => {
  const t0 = Date.now();
  if (!fileEntries.length) {
    log.info(`Initiate index with ${fsEntries.length} entries`);
    return cb(null, fsEntries, initialChanges(fsEntries));
  }

  const fileEntryMap = toMap(fileEntries, e => e.filename);
  const fsEntryMap = toMap(fsEntries, e => e.filename);
  const fileKeys = Object.keys(fileEntryMap);
  const fsKeys = Object.keys(fsEntryMap);

  const onlyFileKeys = fileKeys.filter(key => !fsEntryMap[key]);
  const onlyFsKeys = fsKeys.filter(key => !fileEntryMap[key]);
  const commonKeys = fileKeys.filter(key => fsEntryMap[key]);

  const { commonEntryMap, changedKeys } = mergeIndex(fileEntryMap, fsEntryMap, commonKeys, matcherFn);

  if (hasNoChanges(onlyFileKeys, onlyFsKeys, changedKeys)) {
    log.info(t0, `No changes found`);
    return cb(null, fileEntries, false);
  }

  setPrevSha1sum(changedKeys, fileEntryMap, fsEntryMap)
  const updatedEntryKeys = commonKeys.concat(onlyFsKeys);
  const updatedEntries = updatedEntryKeys.map(key => commonEntryMap[key] || fsEntryMap[key]);

  log.info(t0, `Index merged of ${updatedEntryKeys.length} entries (${onlyFsKeys.length} added, ${changedKeys.length} changed, ${onlyFileKeys.length} deleted)`)
  log.info(`Changes:\n\t${onlyFsKeys.map(f => `A ${f}`).concat(changedKeys.map(f => `C ${f}`)).concat(onlyFileKeys.map(f => `D ${f}`)).join('\n\t')}`)

  const changes = {
    adds: onlyFsKeys.map(key => fsEntryMap[key]),
    changes: changedKeys.map(key => fsEntryMap[key]),
    removes: onlyFileKeys.map(key => fileEntryMap[key])
  }
  cb(null, updatedEntries, changes);
}
