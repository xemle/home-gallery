import { traverseAst } from './traverse-ast.js'

export const orAst = (left, right, col = 0) => ({ type: 'or', value: [left, right], col })

export const andAst = (left, right, col = 0) => ({ type: 'and', value: [left, right], col })

export const cmpAst = (key, op, value, col = 0) => ({ type: 'cmp', key, op, value, col })

export const valueAst = (value, col = 0) => ({ type: 'value', value, col })

const matchRule = (rule, ast) => (!rule.types || rule.types.includes(ast.type)) &&
  (!rule.keys || rule.keys.includes(ast.key)) &&
  (!rule.matchValue || rule.matchValue(ast.value.value))

export const transformAst = (ast, rules) => {
  const applyRules = ast => rules.reduce((ast, rule) => (matchRule(rule, ast) ? (rule.map(ast) || ast) : ast), ast)
  return traverseAst(ast, {before: applyRules} )
}

export const aliasKey = aliases => ast => {
  if (aliases[ast.key]) {
    ast.key = aliases[ast.key]
  }
  return ast
}

