const { matchNumber } = require('./utils')
const { matchCmpFilter, compare } = require('./cmp-filter')

const cmpFnFilters = [
  {
    fns: ['count'],
    keys: ['tags', 'faces', 'objects', 'files'],
    ops: ['=', '<', '<=', '>', '>=', '!='],
    matchValue: matchNumber,
    filter: ast => compare(v => v[ast.key]?.length || 0, ast.op, +ast.value.value)
  }
]

const cmpFnFilter = (ast, options) => {
  const filter = cmpFnFilters.find(cmpFn => matchCmpFnFilter(cmpFn, ast))
  if (filter) {
    return filter.filter(ast, options)
  }
  return options.unknownExpressionHandler(ast, options)
}

const matchCmpFnFilter = (cmpFn, ast) => cmpFn.fns.includes(ast.fn) && matchCmpFilter(cmpFn, ast)

module.exports = {
  cmpFnFilter
}