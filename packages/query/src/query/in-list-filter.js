const inListFilter = (ast, options) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => v.value.toLowerCase())
    return v => v.tags?.length ? v.tags.find(tag => values.includes(tag.toLowerCase())) : false
  } else {
    return options.unknownExpressionHandler(ast, options)
  }
}

module.exports = {
  inListFilter
}
