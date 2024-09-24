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

export const existsFnFilter = (ast, context) => {
  const filter = existsFnFilters.find(cmpFn => matchExistsFnFilter(cmpFn, ast))
  if (filter) {
    ast.filter = filter.filter(ast, context)
  } else {
    ast.filter = () => true
    context.queryErrorHandler(ast, context, `Unknown exists mapping. key=${ast.key} is unknown`)
  }
}

const matchExistsFnFilter = (existsFn, ast) => existsFn.keys.includes(ast.key)
