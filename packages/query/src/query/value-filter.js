import { toLower } from './utils.js'

export const valueFilter = (ast, context) => {
  const needle = toLower(ast.value)
  ast.filter = v => {
    const text = context.textFn(v) || ''
    return text.indexOf(needle) >= 0
  }
}
