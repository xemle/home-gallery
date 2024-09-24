
const isAst = ast => ast?.type && typeof ast.col == 'number'

export const traverseAst = (ast, options = {}) => {
  ast = options?.before ? options.before(ast) || ast : ast

  if (Array.isArray(ast.value)) {
    ast.value = ast.value.map(child => isAst(child) ? traverseAst(child, options) : child)
  } else if (isAst(ast.value)) {
    ast.value = traverseAst(ast.value, options)
  }

  if (ast.type == 'query' && ast.orderBy) {
    ast.orderBy = traverseAst(ast.orderBy, options)
  }

  ast = options?.after ? options.after(ast) || ast : ast
  return ast
}
