const { toLower } = require('./utils')

const uniq = (v, i, a) => i == a.indexOf(v)

const allInFilter = (ast, options) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => toLower(v.value)).filter(uniq)
    return v => v.tags?.length ? v.tags.filter(tag => values.includes(toLower(tag))).length === values.length : false
  } else {
    return options.unknownExpressionHandler(ast, options)
  }
}

module.exports = {
  allInFilter
}
