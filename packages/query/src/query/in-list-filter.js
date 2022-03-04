const { toLower } = require('./utils')

const inListFilter = (ast, options) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => toLower(v.value))
    return v => v.tags?.length ? v.tags.find(tag => values.includes(toLower(tag))) : false
  } else {
    return options.unknownExpressionHandler(ast, options)
  }
}

module.exports = {
  inListFilter
}
