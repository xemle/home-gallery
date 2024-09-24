import t from 'tap'

import { transformAst } from './transform-ast.js'
import { transformRules } from './transform-rules.js'
import { simplifyRules } from './simplify-rules.js'

t.test('location alias', async t => {
  const ast = {
    type: 'keyValue',
    key: 'location',
    value: {
      type: 'value',
      value: 'paris',
      col: 10
    },
    col: 1
  }

  const expected = {
    type: 'or',
    value: [
      {type: 'cmp', key: 'country', op: '=', value: {value: 'paris'}},
      {type: 'cmp', key: 'state', op: '=', value: {value: 'paris'}},
      {type: 'cmp', key: 'city', op: '=', value: {value: 'paris'}},
      {type: 'cmp', key: 'road', op: '=', value: {value: 'paris'}}
    ]
  }
  
  
  t.match(transformAst(ast, {}, transformRules, simplifyRules), expected, 'Map orientation')
})