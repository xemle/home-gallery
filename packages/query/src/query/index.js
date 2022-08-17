const { traverseAst, stringifyAst } = require('../ast')
const { cmpFilter } = require('./cmp-filter')
const { cmpFnFilter } = require('./cmp-fn-filter')
const { existsFnFilter } = require('./exists-filter')
const { inListFilter } = require('./in-list-filter')
const { allInFilter } = require('./all-in-filter')
const { valueFilter } = require('./value-filter')
const { orderBy } = require('./order-by')
const { numericKeys, rangeKeys, textKeys, aliases } = require('./keys')

const defaultOptions = {
  textFn: v => JSON.stringify(v).toLowerCase(),
  unknownExpressionHandler: ast => {
    throw new Error(`Unknown expression ${ast.type} with key ${ast.key || 'none'} at ${ast.col}`)
  }
}

const execQuery = (entries, ast, options, cb) => {
  const mergedOptions = {...defaultOptions, ...options};

  try {
    traverseAst(ast, {after: ast => addFilter(ast, mergedOptions)})
    const result = entries.filter(ast.filter)
    cb(null, orderBy(result, ast));
  } catch (err) {
    const e = new Error(`Invalid query ast ${stringifyAst(ast)}: ${err}`)
    e.cause = err
    cb(e);
  }
}

const addFilter = (ast, options) => {
  switch (ast.type) {
    case 'query': ast.filter = ast.value ? ast.value.filter : () => true; break;
    case 'paren': ast.filter = ast.value.filter; break;
    case 'terms': ast.filter = v => !ast.value.find(term => !term.filter(v)); break;
    case 'or': ast.filter = v => ast.value[0].filter(v) || ast.value[1].filter(v); break;
    case 'and': ast.filter = v => ast.value[0].filter(v) && ast.value[1].filter(v); break;
    case 'not': ast.filter = v => !ast.value.filter(v); break;
    case 'cmp': ast.filter = cmpFilter(ast, options); break;
    case 'cmpFn': ast.filter = cmpFnFilter(ast, options); break;
    case 'existsFn': ast.filter = existsFnFilter(ast, options); break;
    case 'inList': ast.filter = inListFilter(ast, options); break;
    case 'allIn': ast.filter = allInFilter(ast, options); break;
    case 'identifier':
    case 'value':
    case 'text':
    case 'comboundValue': ast.filter = valueFilter(ast, options); break;
    default: ast.filter = () => true; options.unknownExpressionHandler(ast, options)
  }
}

module.exports = {
  execQuery,
  numericKeys,
  rangeKeys,
  textKeys,
  aliases
};
