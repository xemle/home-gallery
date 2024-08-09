import { traverseAst } from './traverse-ast.js'

const matchRule = (ast, rule) => {
  return (!rule.types || rule.types.includes(ast.type)) &&
    (!rule.keys || rule.keys.includes(ast.key)) &&
    (!rule.ops || rule.ops.includes(ast.op)) &&
    (!rule.matchValue || rule.matchValue(ast.value.value))
}

const transformVisitor = (rules, context) => ast => {
  return rules.reduce((ast, rule) => {
    if (!matchRule(ast, rule)) {
      return ast
    }
    return rule.transform(ast, context) || ast
  }, ast)
}

export const transformAst = (ast, context, rules, optimizeRules = []) => {
  return traverseAst(ast, {
    before: transformVisitor(rules, context),
    after: transformVisitor(optimizeRules, context)
  })
}
