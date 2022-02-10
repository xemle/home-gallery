const { parse } = require('./parser');
const { transformAst, orAst, andAst, cmpAst, valueAst, aliasKey, stringifyAst } = require('./ast')
const { execQuery, numericKeys, textKeys, aliases } = require('./query');

const uniq = (v, i, a) => a.indexOf(v) === i;
const flatten = (r, v) => r.concat(v);

const stringifyEntry = entry => {
  return [
    entry.id.substring(0, 10),
    entry.type,
    entry.date ? entry.date.substring(0, 10) : '',
    entry.make,
    entry.model,
    entry.files ? entry.files[0].filename : '',
    entry.country,
    entry.state,
    entry.city,
    entry.road
  ]
  .concat(entry.tags || [])
  .concat((entry.objects || []).map(object => object.class).filter(uniq))
  .concat((entry.faces || []).map(face => face.expressions).reduce(flatten, []).filter(uniq))
  .concat((entry.faces || []).map(face => `${Math.trunc(face.age / 10) * 10}s`).reduce(flatten, []).filter(uniq))
  .join(' ')
  .toLowerCase();
}

const ignoreUnknownExpressions = () => true

const throwUnknownExpressions = ast => {
  throw new Error(`Unknown expression ${ast.type} with key ${ast.key || 'none'} at ${ast.col}`)
}

const defaultOptions = {
  textFn: (entry) => {
    if (!entry.textCache) {
      entry.textCache = stringifyEntry(entry);
    }
    return entry.textCache;
  },
  unknownExpressionHandler: () => ignoreUnknownExpressions
}

const transformRules = [
  {
    // map inRange to 'value >= low and value <= high'
    types: ['inRange'],
    keys: numericKeys,
    map: ast => andAst(cmpAst(ast.key, '>=', ast.value[0], ast.col), cmpAst(ast.key, '<=', ast.value[1]), ast.col)
  },
  {
    // map ratio shortcuts
    types: ['keyValue'],
    keys: ['ratio'],
    matchValue: v => ['panorama', 'landscape', 'square', 'portrait'].includes(v),
    map: ast => {
      switch (ast.value.value) {
        case 'panorama': return cmpAst(ast.key, '>', valueAst('2', ast.value.col), ast.col)
        case 'landscape': return cmpAst(ast.key, '>', valueAst('1', ast.value.col), ast.col)
        case 'square': return cmpAst(ast.key, '=', valueAst('1', ast.value.col), ast.col)
        default: return cmpAst(ast.key, '<', valueAst('1', ast.value.col), ast.col)
      }
    }
  },
  {
    // map keyValue to 'key = value'
    types: ['keyValue'],
    keys: [...numericKeys, ...textKeys],
    map: ast => cmpAst(ast.key, '=', ast.value, ast.col)
  },
  {
    // map location alias to 'country or state or city or road'
    keys: ['location'],
    map: ast => orAst(orAst({...ast, key: 'country'}, {...ast, key: 'state'}), orAst({...ast, key: 'city'}, {...ast, key: 'road'}))
  },
  {
    // map geo alias to 'latitude and longitude'
    keys: ['geo'],
    map: ast => andAst({...ast, key: 'latitude'}, {...ast, key: 'longitude'})
  },
  {
    // map aliases to common keys
    keys: Object.keys(aliases),
    map: aliasKey(aliases)
  },
]

const filterEntriesByQuery = async (entries, query, options = {}) => {
  if (!entries || !entries.length || !query) {
    return { entries };
  }

  return new Promise((resolve, reject) => {
    parse(query, (err, parseAst) => {
      if (err) {
        return reject(err)
      }

      // We transform some ast nodes to save some implementation rules
      const ast = transformAst(parseAst, transformRules)
      execQuery(entries, ast, {...defaultOptions, ...options}, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve({
          entries: result,
          parseAst,
          ast
        });
      })
    })

  })
}

const clearEntriesTextCache = entries => entries.forEach(entry => entry.textCache = false)

const buildEntriesTextCache = entries => entries.forEach(entry => entry.textCache = stringifyEntry(entry))

module.exports = {
  filterEntriesByQuery,
  ignoreUnknownExpressions,
  throwUnknownExpressions,
  stringifyEntry,
  parse,
  execQuery,
  stringifyAst,
  clearEntriesTextCache,
  buildEntriesTextCache
};
