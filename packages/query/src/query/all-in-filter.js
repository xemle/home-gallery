import { toLower } from './utils.js'

const uniq = (v, i, a) => i == a.indexOf(v)

export const allInFilter = (ast, context) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => toLower(v.value)).filter(uniq)
    ast.filter = v => v.tags?.length ? v.tags.filter(tag => values.includes(toLower(tag))).length === values.length : false
  } else {
    ast.filter = () => true
    context.queryErrorHandler(ast, context, `Unknown allIn function mapping. key=${ast.key} is known`)
  }
}
