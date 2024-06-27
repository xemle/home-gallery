import { parse } from './parser/index.js';
import { transformAst, orAst, andAst, cmpAst, valueAst, aliasKey } from './ast/index.js'
import { numericKeys, rangeKeys, textKeys, aliases, execQuery } from './query/index.js';
import { stringifyEntry } from './stringify-entry.js'

export { stringifyAst } from './ast/index.js'
export { stringifyEntry } from './stringify-entry.js'
export { createStringifyEntryCache } from './stringify-entry-cache.js'

export const ignoreUnknownExpressions = () => true

export const throwUnknownExpressions = ast => {
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

export const filterEntriesByQuery = async (entries, query, options = {}) => {
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
