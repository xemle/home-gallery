const sortBy = (valueFn, direction = -1) => (a, b) => {
  const aValue = valueFn(a)
  const bValue = valueFn(b)
  let result
  if (aValue == bValue) {
    // fallback order by date if values are the same or both are falsy
    result = a.date < b.date ? direction : -direction
  } else if (aValue && bValue) {
    result = aValue < bValue ? direction : -direction
  } else if (aValue) {
    result = -direction
  } else if (bValue) {
    result = direction
  }
  return result
}

const sortDirection = (ast, defaultDirection) => ast.direction === false ? defaultDirection || -1 : (ast.direction == 'asc' ? -1 : 1)

const orderRules = [
  {
    type: 'sortKey',
    keys: ['date', 'updated', 'duration', 'width', 'height'],
    sort: (entries, ast) => entries.sort(sortBy(v => v[ast.value] || 0, sortDirection(ast, 1)))
  },
  {
    type: 'sortKey',
    keys: ['filesize'],
    defaultDirection: -1,
    sort: (entries, ast) => entries.sort(sortBy(v => v.files ? v.files[0].size : 0, sortDirection(ast, -1)))
  },
  {
    type: 'sortKey',
    keys: ['random'],
    sort: (entries) => {
      for (let i = entries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entries[j], entries[i]] = [entries[i], entries[j]]
      }
      return entries
    }
  },
  {
    type: 'countSortFn',
    keys: ['files', 'tags', 'faces', 'objects'],
    sort: (entries, ast) => entries.sort(sortBy(v => v[ast.value]?.length || 0, sortDirection(ast, 1)))
  },
]

const matchRule = (rule, ast) => (!rule.type || rule.type == ast.type) && (!rule.keys || rule.keys.includes(ast.value))

export const orderBy = (entries, ast) => {
  const orderByAst = ast.orderBy
  if (!orderByAst) {
    return entries
  }

  const match = orderRules.find(rule => matchRule(rule, orderByAst))
  if (!match) {
    return entries
  }

  return match.sort(entries, orderByAst)
}
