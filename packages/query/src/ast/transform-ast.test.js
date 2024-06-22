import t from 'tap'

import { transformAst, cmpAst, valueAst } from './transform-ast.js'

t.only('Simple', async t => {
  const ast = {
    type: 'keyValue',
    key: 'ratio',
    value: {
      type: 'value',
      value: 'landscape',
      col: 7,
    },
    col: 1
  }

  const rules = [{
    types: ['keyValue'],
    keys: ['ratio'],
    matchValue: v => ['landscape'].includes(v),
    map: ast => cmpAst(ast.key, '>', valueAst('1', ast.value.col), ast.col)
  }]

  t.same(transformAst(ast, rules), {type: 'cmp', key: 'ratio', op: '>', value: {type: 'value', value: '1', col: 7}, col: 1}, 'Map orienation')
})