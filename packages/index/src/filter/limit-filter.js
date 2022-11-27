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
const log = require('@home-gallery/logger')('index.filter.limit');

const getLimitValues = addLimits => {
  const limits = addLimits.split(',')
  return {
    initial: +limits[0] || 200,
    offset: +limits[1] || 500,
    factor: Math.max(1, +limits[2] || 1),
    max: +limits[3] || 8000
  }
}

const getLimit = (entryCount, addLimits) => {
  const {initial, offset, factor, max} = getLimitValues(addLimits);
  if (entryCount == 0) {
    return initial;
  } else {
    return +Math.min(entryCount + max, Math.max(entryCount + offset, entryCount * factor)).toFixed(0);
  }
}

const createLimitFilter = (entryCount, addLimits, filter) => {
  if (!addLimits) {
    return filter;
  }

  const limit = getLimit(entryCount, addLimits);

  log.info(`Index has ${entryCount} entries. Set index limit to max ${limit} entries with ${limit - entryCount} new entries`)
  let count = 0;
  const limitFilter = (path, stat) => {
    const result = filter(path, stat);
    if (!result) {
      return result;
    }

    count++
    if (count == limit) {
      log.info(`Index limit of ${limit} exceeded. No more files are added to the file index.`)
    }
    return count <= limit;
  }

  limitFilter.limitExceeded = () => count >= limit;
  return limitFilter
}

module.exports = {
  createLimitFilter
}
