const allInFilter = (ast, options) => {
  if (ast.key == 'tags') {
    const values = ast.value.map(v => v.value.toLowerCase()).filter((v, i, a) => a.indexOf(v) == i)
    return v => v.tags?.length ? v.tags.filter(tag => typeof tag == 'string' && values.includes(tag.toLowerCase())).length === values.length : false
  } else {
    return options.unknownExpressionHandler(ast, options)
  }
}

module.exports = {
  allInFilter
}
