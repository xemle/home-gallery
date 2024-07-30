import { orAst, andAst, cmpAst, valueAst } from './ast-factories.js'
import { numericKeys, rangeKeys, textKeys } from './ast-keys.js';
import { keyAliasMap } from './ast-aliases.js';

/**
 * Rewrite the ast from top to down and resolve some
 * alias rules
 *
 * Transformation rules which are executed in order
 */
export const transformRules = [
  {
    // map aliases to common keys
    keys: Object.keys(keyAliasMap),
    transform: ast => ({...ast, key: keyAliasMap[ast.key]})
  },
  {
    // map inRange to 'value >= low and value <= high'
    types: ['inRange'],
    keys: rangeKeys,
    transform: ast => andAst([
      cmpAst(ast.key, '>=', ast.value[0], ast.col),
      cmpAst(ast.key, '<=', ast.value[1], ast.col)
    ], ast.col)
  },
  {
    // map keyValue to 'key = value'
    types: ['keyValue'],
    keys: [...numericKeys, ...textKeys],
    transform: ast => cmpAst(ast.key, '=', ast.value, ast.col)
  },
  {
    // map ratio shortcuts
    types: ['cmp'],
    keys: ['ratio'],
    ops: ['='],
    matchValue: v => ['panorama', 'landscape', 'square', 'portrait'].includes(v),
    transform: ast => {
      switch (ast.value.value) {
        case 'panorama': return cmpAst(ast.key, '>', valueAst('2', ast.value.col), ast.col)
        case 'landscape': return cmpAst(ast.key, '>', valueAst('1', ast.value.col), ast.col)
        case 'square': return cmpAst(ast.key, '=', valueAst('1', ast.value.col), ast.col)
        default: return cmpAst(ast.key, '<', valueAst('1', ast.value.col), ast.col)
      }
    }
  },
  {
    // map location alias to 'country or state or city or road'
    keys: ['location'],
    transform: ast => orAst([
      {...ast, key: 'country'},
      {...ast, key: 'state'},
      {...ast, key: 'city'},
      {...ast, key: 'road'},
    ], ast.col)
  },
  {
    // map geo alias to 'latitude and longitude'
    keys: ['geo'],
    transform: ast => andAst([
      {...ast, key: 'latitude'},
      {...ast, key: 'longitude'}
    ], ast.col)
  },
]
