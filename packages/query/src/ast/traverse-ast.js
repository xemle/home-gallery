const singleTypes = ['query', 'not', 'paren', 'keyValue', 'cmp', 'cmpFn']

const listTypes = ['or', 'and', 'terms', 'inList', 'inRange', 'allIn']

export const traverseAst = (ast, options) => {
  ast = options?.before ? options.before(ast) || ast : ast
  if (singleTypes.includes(ast.type) && ast.value) {
    ast.value = traverseAst(ast.value, options)
  } else if (listTypes.includes(ast.type)) {
    ast.value = ast.value.map(value => traverseAst(value, options))
  }
  ast = options?.after ? options.after(ast) || ast : ast
  return ast
}
