import { toLower } from './utils.js'

export const valueFilter = (ast, options) => {
  const needle = toLower(ast.value)
  return v => {
    const text = options.textFn(v) || ''
    return text.indexOf(needle) >= 0
  }
}
