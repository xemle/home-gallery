const sortBy = valueFn => (a, b) => {
  const aValue = valueFn(a)
  const bValue = valueFn(b)
  let result
  if (aValue == bValue) {
    // fallback order by date if values are the same or both are falsy
    result = a.date < b.date ? -1 : 1
  } else if (aValue && bValue) {
    result = aValue < bValue ? -1 : 1
  } else if (aValue) {
    result = 1
  } else if (bValue) {
    result = -1
  }
  return result
}

const orderRules = [
  {
    type: 'sortKey',
    keys: ['date', 'updated', 'duration', 'width', 'height'],
    defaultDirection: -1,
    sort: ast => sortBy(v => v[ast.value] || 0)
  },
  {
    type: 'sortKey',
    keys: ['filesize'],
    defaultDirection: -1,
    sort: () => sortBy(v => v.files ? v.files[0].size : 0)
  },
  {
    type: 'sortKey',
    keys: ['random'],
    sort: () => sortBy(() => Math.random())
  },
  {
    type: 'countSortFn',
    keys: ['files', 'tags', 'faces', 'objects'],
    defaultDirection: -1,
    sort: ast => sortBy(v => v[ast.value] ? v[ast.value].length : 0)
  },
]

const matchRule = (rule, ast) => (!rule.type || rule.type == ast.type) && (!rule.keys || rule.keys.includes(ast.value))

const orderBy = (entries, ast) => {
  const orderByAst = ast.orderBy
  if (!orderByAst) {
    return entries
  }

  const match = orderRules.find(rule => matchRule(rule, orderByAst))
  if (!match) {
    return entries
  }

  const sortFn = match.sort(orderByAst)
  const direction = orderByAst.direction === false ? match.defaultDirection || 1 : (orderByAst.direction == 'asc' ? 1 : -1)
  entries.sort((a, b) => sortFn(a, b) * direction)

  return entries
}

module.exports = {
  orderBy
}