import { stringifyAst } from '../ast/index.js'

import { createFilterMapSort } from './factory.js'

export { createFilterMapSort } from './factory.js'

export const execQuery = async (entries, ast, context) => {
  return new Promise((resolve, reject) => {
    try {
      const [filterFn, mapperFn, sortFn] = createFilterMapSort(ast, context)

      const filteredEntries = entries.filter(filterFn)
      const mappedEntries = filteredEntries.map(mapperFn)
      const sortedEntries = sortFn(mappedEntries, entries)
      resolve(sortedEntries)
    } catch (err) {
      reject(new Error(`Invalid query ast ${stringifyAst(ast)}: ${err}`, {cause: err}))
    }
  })
}
