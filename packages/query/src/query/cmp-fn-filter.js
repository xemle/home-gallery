import { matchNumber } from './utils.js'
import { matchCmpFilter, compare } from './cmp-filter.js'

const cmpFnFilters = [
  {
    fns: ['count'],
    keys: ['tags', 'faces', 'objects', 'files'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: matchNumber,
    filter: ast => compare(v => v[ast.key]?.length || 0, ast.op, +ast.value.value)
  }
]

export const cmpFnFilter = (ast, options) => {
  const filter = cmpFnFilters.find(cmpFn => matchCmpFnFilter(cmpFn, ast))
  if (filter) {
    return filter.filter(ast, options)
  }
  return options.unknownExpressionHandler(ast, options)
}

const matchCmpFnFilter = (cmpFn, ast) => cmpFn.fns.includes(ast.fn) && matchCmpFilter(cmpFn, ast)
