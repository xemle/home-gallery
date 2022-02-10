const existsFnFilters = [
  {
    keys: ['make', 'model', 'country', 'state', 'city', 'road'],
    filter: ast => v => !!v[ast.key]
  },
  {
    keys: ['latitude', 'longitude'],
    filter: ast => v => typeof v[ast.key] == 'number' && v[ast.key] != 0
  },
  {
    keys: ['tags', 'faces', 'objects', 'files'],
    filter: ast => v => v[ast.key]?.length
  },
]

const existsFnFilter = (ast, options) => {
  const filter = existsFnFilters.find(cmpFn => matchExistsFnFilter(cmpFn, ast))
  if (filter) {
    return filter.filter(ast, options)
  }
  return options.unknownExpressionHandler(ast, options)
}

const matchExistsFnFilter = (existsFn, ast) => existsFn.keys.includes(ast.key)

module.exports = {
  existsFnFilter
}