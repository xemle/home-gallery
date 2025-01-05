/*
Index add filter: Controls how many new entries are added to the index.
It is used for initial incremental import. Since the gallery is only
aware of indexed files we can control the import progress by limit the
index step.

The use case is to give quick results at the beginning of an initial
import but process larger chunks later.

The format is initial,add?,factor?,max? (add, factor and max are optional)

initial: Initial entry count for an new/empty index
offset:  Amount of new entries for a non empty index. Eg. index has 1000
         entries and offset is 500 than new limit is 1500 entries
factor:  Factor of index entries. Eg. index has 1000 entries and factor
         is 1.25 than the new limit is 1250 entries
max:     Max amount of new entries

The maxiumum of offset or factor is used, limited to the max offset.
Eg. index has 1000 entries, offset is 500 and factor is 1.25. The result
limit is 1500 as maximum of 1500 and 1250.

For add limits of 200,500,1.25,8000 the progress of index entries would be

200
700 (+500)
1200 (+500)
1700 (+500)
2200 (+500)
2750 (*1.25)
3437 (*1.25)
4296 (*1.25)
...
32001 (*1.25)
40001 (*1.25)
48001 (+8000)
56001 (+8000)
...
 */
import Logger from '@home-gallery/logger'
import { IIndexEntry, IWalkerFileHandler } from '../types.js';

const log = Logger('index.filter.limit');

type IAddLimits = {
  initial: number
  offset: number
  factor: number
  max: number
}

const getLimitValues = (addLimits: string): IAddLimits => {
  const limits = addLimits.split(',')
  return {
    initial: +limits[0] || 200,
    offset: +limits[1] || 500,
    factor: Math.max(1, +limits[2] || 1) - 1,
    max: +limits[3] || 8000
  }
}

export function getNewFileLimit(entryCount: number, addLimits: string): number {
  const {initial, offset, factor, max} = getLimitValues(addLimits);
  if (entryCount == 0) {
    return initial;
  } else {
    return Math.min(max, Math.max(offset, Math.floor(entryCount * factor)));
  }
}

type IWalkerFileLimitHandler = IWalkerFileHandler & {
  limitExceeded: () => true
}

export function createLimitFilter(entryCount: number, filename2Entry: Record<string, IIndexEntry>, addLimits: string, filter): IWalkerFileLimitHandler {
  if (!addLimits) {
    return filter;
  }

  const fileLimit = getNewFileLimit(entryCount, addLimits);
  log.info(`Index has ${entryCount} entries. Set index limit to max ${fileLimit} new entries`)

  let count = 0;
  const limitFilter = (filename, stat) => {
    const result = filter(filename, stat);
    if (!result) {
      return result;
    } else if (filename2Entry[filename]) {
      return true;
    }

    count++
    if (count == fileLimit) {
      log.info(`Index limit of ${fileLimit} exceeded. No more new files are added to the file index.`)
    }
    return count <= fileLimit;
  }

  limitFilter.limitExceeded = () => count >= fileLimit;
  return limitFilter as IWalkerFileLimitHandler
}
