const { parse } = require('./parse');
const { createFilter } = require('./ast');

const stringifyEntry = entry => {
  return [
    entry.id.substring(0, 10),
    entry.type,
    entry.date && entry.date.substring(0, 10),
    entry.make,
    entry.model,
    entry.files[0].filename,
    entry.country,
    entry.state,
    entry.city
  ]
  .concat(entry.tags || [])
  .concat(entry.objects?.map(object => object.class).filter((v, i, a) => a.indexOf(v) === i) || [])
  .join(' ')
  .toLowerCase();
}

const options = {
  textFn: (entry) => {
    if (!entry.textCache) {
      entry.textCache = stringifyEntry(entry);
    }
    return entry.textCache;
  }
}

const filterEntriesByQuery = (entries, query, cb) => {
  if (!entries || !entries.length || !query) {
    return cb(null, entries);
  }

  parse(query, (err, ast) => {
    if (err) {
      return cb(err);
    }

    createFilter(ast, options, (err, filter) => {
      if (err) {
        return cb(err);
      }
      cb(null, entries.filter(filter));
    })
  })
}

module.exports = { filterEntriesByQuery, stringifyEntry, parse, createFilter };
