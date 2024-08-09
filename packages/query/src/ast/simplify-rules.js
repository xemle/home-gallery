/**
 * These rules simplify the ast without changing the expression semantic.
 *
 * These rules are applied from bottom to top
 */
export const simplifyRules = [
  {
    // use and type instead of terms
    types: ['terms'],
    transform: ast => ({...ast, type: 'and'})
  },
  {
    // eliminate paren
    types: ['paren'],
    transform: ast => ast.value
  },
  {
    // Set cmp value type to text
    types: ['cmp'],
    transform: ast => {
      const valueType = ast.value?.type
      if (valueType == 'comboundValue' || valueType == 'identifier') {
        ast.value = {...ast.value, type: 'text'}
      }
      return ast
    }
  },
  {
    // Remove noop from and/or
    types: ['and', 'or'],
    transform: ast => {
      ast.value = ast.value.reduce((value, child) => {
        if (child.type != 'noop') {
          value.push(child)
        }
        return value
      }, [])
      return ast
    }
  },
  {
    // merge children of same type
    types: ['and', 'or'],
    transform: ast => {
      ast.value = ast.value.reduce((value, child) => {
        if (child.type == ast.type) {
          value.push(...child.value)
        } else {
          value.push(child)
        }
        return value
      }, [])
      return ast
    }
  },
  {
    // remove duplicates
    types: ['and', 'or'],
    transform: ast => {
      const createId = ast => {
        if (Array.isArray(ast.value)) { // and, or
          const childIds = ast.value.map(createId)
          if (ast.type == 'and') { // and expr can be sorted
            childIds.sort()
          }
          return `{${ast.type}:[${childIds.join(',')}]}`
        } else if (ast.value?.type && typeof ast.value.col == 'number') { // child is an ast
          return `{${ast.type}:[${createId(ast.value)}]}`
        } else if (ast.op) { // cmp, cmpFn
          return `{${ast.type}:${ast.fn} ${ast.key} ${ast.op} ${ast.value}}`
        } else if (ast.key) {
          return `{${ast.type}:${ast.fn} ${ast.key},${ast.value}}`
        } else {
          return `{${ast.type}:${ast.value}}`
        }
      }

      const childIds = []
      ast.value = ast.value.filter(child => {
        const id = createId(child)
        if (childIds.includes(id)) {
          return false
        }
        childIds.push(id)
        return true
      })

      return ast
    }
  },
  {
    // remove single list
    types: ['and', 'or'],
    transform: ast => {
      if (ast.value.length == 1) {
        return ast.value[0]
      }
      return ast
    }
  },
  {
    // remove single list
    types: ['and', 'or'],
    transform: ast => {
      if (!ast.value.length) {
        return {type: 'noop', col: ast.col}
      }
      return ast
    }
  },
  {
    // double negated
    types: ['not'],
    transform: ast => {
      if (ast.value.type == 'not') {
        return ast.value.value
      }
      return ast
    }
  },
]