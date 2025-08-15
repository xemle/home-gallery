import Logger from '@home-gallery/logger'
import { IIndexEntryMap, IIndexEntryMatcherFn } from './types.js';

const log = Logger('index.merge');

export function mergeIndex(fileEntryMap: IIndexEntryMap, fsEntryMap: IIndexEntryMap, commonKeys: string[], matcherFn: IIndexEntryMatcherFn): [IIndexEntryMap, string[]] {
  const t0 = Date.now();
  let changedKeys: string[] = [];

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
  return [commonEntryMap, changedKeys];
}
