import t from 'tap'

import { simplifyRules } from './simplify-rules.js'
import { transformAst } from './transform-ast.js'

t.test('basic', async t => {
  const ast = {
    type: 'and',
    value: [
      {
        type: 'noop',
        col: 0
      },
      {
        type: 'identifier',
        value: 'foo',
        col: 0
      }
    ],
    col: 0
  }

  // Remove 'noop' from 'and'
  // Reduce 'single' and 'list'
  const result = transformAst(ast, {}, [], simplifyRules)


  t.match(result, {type: 'identifier', value: 'foo', col: 0})
})

t.test('and', async t => {
  t.test('empty and list should be noop', async t => {
    const ast = {
      type: 'and',
      value: [],
      col: 2
    }

    const result = transformAst(ast, {}, [], simplifyRules)


    t.match(result, {type: 'noop', col: 2})
  })

  t.test('empty and list should be noop', async t => {
    const ast = {
      type: 'or',
      value: [],
      col: 2
    }

    const result = transformAst(ast, {}, [], simplifyRules)


    t.match(result, {type: 'noop', col: 2})
  })
})

t.test('cmp', async t => {
  t.test('set comboundValue to text', async t => {
    const ast = {
      type: 'cmp',
      key: 'year',
      op: '=',
      value: {
        type: 'comboundValue',
        value: '2024',
        col: 0
      },
      col: 0
    }

    const result = transformAst(ast, {}, [], simplifyRules)


    t.match(result, {type: 'cmp', key: 'year', op: '=', value: {type: 'text', value: '2024', col: 0}, col: 0})
  })

  t.test('set identifier to text', async t => {
    const ast = {
      type: 'cmp',
      key: 'year',
      op: '=',
      value: {
        type: 'identifier',
        value: '2024',
        col: 0
      },
      col: 0
    }

    const result = transformAst(ast, {}, [], simplifyRules)


    t.match(result, {type: 'cmp', key: 'year', op: '=', value: {type: 'text', value: '2024', col: 0}, col: 0})
  })

})