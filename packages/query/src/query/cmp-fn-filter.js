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

export const cmpFnFilter = (ast, context) => {
  const filter = cmpFnFilters.find(cmpFn => matchCmpFnFilter(cmpFn, ast))
  if (filter) {
    ast.filter = filter.filter(ast, context)
  } else {
    ast.filter = () => true
    context.queryErrorHandler(ast, context, `Unknown cmpFn compare mapping. fn=${ast.fn}, key=${ast.key}, op=${ast.op} or value='${ast.value?.value}' is unknown`)
  }
}

const matchCmpFnFilter = (cmpFn, ast) => cmpFn.fns.includes(ast.fn) && matchCmpFilter(cmpFn, ast)
