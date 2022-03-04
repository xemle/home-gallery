const { toLower } = require('./utils')

const allInFilter = (ast, options) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => toLower(v.value)).filter((v, i, a) => a.indexOf(v) == i)
    return v => v.tags?.length ? v.tags.filter(tag => values.includes(toLower(tag))).length === values.length : false
  } else {
    return options.unknownExpressionHandler(ast, options)
  }
}

module.exports = {
  allInFilter
}
