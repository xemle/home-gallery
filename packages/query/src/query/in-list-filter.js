import { toLower } from './utils.js'

export const inListFilter = (ast, context) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => toLower(v.value))
    ast.filter = v => v.tags?.length ? v.tags.find(tag => values.includes(toLower(tag))) : false
  } else {
    ast.filter = () => true
    context.queryErrorHandler(ast, context, `Unknown inList compare mapping. key=${ast.key} is unknown`)
  }
}

