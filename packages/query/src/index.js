import { parse } from './parser/index.js';

import { stringifyEntry } from './stringify-entry.js'
import { execQuery } from './query/index.js'
import { transformAst, transformRules } from './ast/index.js'

export * from './parser/index.js';
export * from './ast/index.js'

export { createFilterMapSort } from './query/index.js';
export { stringifyAst, transformAst } from './ast/index.js'
export { stringifyEntry } from './stringify-entry.js'
export { createStringifyEntryCache } from './stringify-entry-cache.js'

export const ignoreUnknownExpressions = () => true

export const throwUnknownExpressions = ast => {
  throw new Error(`Unknown expression ${ast.type} with key ${ast.key || 'none'} at ${ast.col}`)
}

const defaultOptions = {
  textFn: stringifyEntry,
  // deprecated. Use queryErrorHandler
  unknownExpressionHandler: () => ignoreUnknownExpressions,
  queryErrorHandler(ast, options, reason) {
    return this.unknownExpressionHandler(ast, options)
  },
  plugin: {}
}

export const filterEntriesByQuery = async (entries, query, context = {}) => {
  if (!entries || !entries.length || !query) {
    return { entries };
  }

  return parse(query)
    .then(parsedAst => {
      // We transform some ast nodes to save some implementation rules
      const ast = transformAst(parsedAst, {}, transformRules)

      // TODO call plugin transform rules here
      return execQuery(entries, ast, {...defaultOptions, ...context})
        .then(entries => {
          return {
            entries,
            parsedAst,
            ast
          }
        })
        .catch(execErr => {
          const err = new Error(`Failed to execute search query`, {cause: execErr})
          err.ast = ast
          err.parsedAst = parsedAst
          return Promise.reject(err)
        })
    })
}
