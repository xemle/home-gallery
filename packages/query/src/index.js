const { parse } = require('./parser');
const { transformAst, orAst, andAst, cmpAst, valueAst, aliasKey, stringifyAst } = require('./ast')
const { execQuery, numericKeys, rangeKeys, textKeys, aliases } = require('./query');

const { stringifyEntry } = require('./stringify-entry')
const { createStringifyEntryCache } = require('./stringify-entry-cache')

const ignoreUnknownExpressions = () => true

const throwUnknownExpressions = ast => {
  throw new Error(`Unknown expression ${ast.type} with key ${ast.key || 'none'} at ${ast.col}`)
}

const defaultOptions = {
  textFn: stringifyEntry,
  unknownExpressionHandler: () => ignoreUnknownExpressions
}

const transformRules = [
  {
    // map inRange to 'value >= low and value <= high'
    types: ['inRange'],
    keys: rangeKeys,
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

module.exports = {
  filterEntriesByQuery,
  ignoreUnknownExpressions,
  throwUnknownExpressions,
  stringifyEntry,
  createStringifyEntryCache,
  parse,
  execQuery,
  stringifyAst,
};
