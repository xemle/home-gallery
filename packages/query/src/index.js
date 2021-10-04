const { parse } = require('./parse');
const { createFilter } = require('./ast');

const uniq = (v, i, a) => a.indexOf(v) === i;
const flatten = (r, v) => r.concat(v);

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
  .concat((entry.objects || []).map(object => object.class).filter(uniq))
  .concat((entry.faces || []).map(face => face.expressions).reduce(flatten, []).filter(uniq))
  .concat((entry.faces || []).map(face => `${Math.trunc(face.age / 10) * 10}s`).reduce(flatten, []).filter(uniq))
  .join(' ')
  .toLowerCase();
}

const ignoreUnknownExpressions = v => true

const options = {
  textFn: (entry) => {
    if (!entry.textCache) {
      entry.textCache = stringifyEntry(entry);
    }
    return entry.textCache;
  },
  unknownExpressionHandler: () => ignoreUnknownExpressions
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

const clearEntriesTextCache = entries => entries.forEach(entry => entry.textCache = false)

const buildEntriesTextCache = entries => entries.forEach(entry => entry.textCache = stringifyEntry(entry))

module.exports = { filterEntriesByQuery, stringifyEntry, parse, createFilter, clearEntriesTextCache, buildEntriesTextCache };
