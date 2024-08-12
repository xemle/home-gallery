import { TQueryExecutor, TQueryContext, TQueryPlugin, TAst, TAstTransformRule, TQueryAstErrorHandler, TQueryTextFn } from "@home-gallery/types";
import { parse, transformAst, transformRules, simplifyRules, createFilterMapSort, stringifyAst } from "@home-gallery/query";

type TQueryExecutorFactory = {
  execute: TQueryExecutor
}

const sortByOrder = (a: TQueryPlugin, b: TQueryPlugin) => {
  const aOrder = a.order || 1
  const bOrder = b.order || 1
  return aOrder <= bOrder ? -1 : 1
}

export class QueryExecutor implements TQueryExecutorFactory {
  plugins: TQueryPlugin[] = []
  textFns: TQueryTextFn[] = []
  transformRules: TAstTransformRule[] = [...transformRules]
  queryHandlers: TQueryAstErrorHandler[] = []

  addQueryPlugins(plugins: TQueryPlugin[]) {
    this.plugins.push(...plugins)
    this.plugins.sort(sortByOrder)
    this.textFns = this.plugins.filter(p => p.textFn).map(p => p.textFn!)
    this.transformRules = this.#getTransformRules()
    this.queryHandlers = this.plugins.filter(p => p.queryHandler).map(p => p.queryHandler!)
  }

  #getTransformRules() {
    const rules = [...transformRules] as TAstTransformRule[]
    this.plugins.filter(p => p.transformRules?.length).forEach(plugin => {
      rules.push(...plugin.transformRules!)
    })
    return rules
  }

  async execute(entries: any[], query: string, context: TQueryContext) {
    const { textFn, queryErrorHandler } = context
    const proxyQueryContext: TQueryContext = {
      ...context,
      textFn: (entry: any) => {
        return textFn(entry) + ' ' + this.textFns.map(textFn => textFn(entry)).join(' ')
      },
      queryErrorHandler: (ast: TAst, context: TQueryContext, reason) => {
        return !![...this.queryHandlers, queryErrorHandler].find(handler => handler(ast, context, reason))
      }
    }

    return parse(query)
      .catch((e: any) => {
        throw new Error(`Failed to parse query '${query}': ${e}`, {cause: e})
      })
      .then((ast: TAst) => {
        const queryAst = transformAst(ast, proxyQueryContext, this.transformRules, simplifyRules)
        context.ast = ast
        context.queryAst = queryAst
        context.stringifiedQueryAst = stringifyAst(queryAst)
        return queryAst
      }).then((queryAst: TAst) => {
        try {
          const [queryFilter, queryMapper, querySort] = createFilterMapSort(queryAst, proxyQueryContext)
          context.queryFilter = queryFilter
          context.queryMapper = queryMapper
          context.querySort = querySort
          return [queryFilter, queryMapper, querySort]
        } catch (e) {
          throw new Error(`Failed to create query filter and sort function`, {cause: e})
        }
      }).then(([queryFilter, queryMapper, querySort]: [(e: any) => boolean, (e: any) => any, ((e: any[], all: any[]) => any[])]) => {
        let filtered
        try {
          filtered = entries.filter(queryFilter)
        } catch (e) {
          throw new Error(`Failed to filter entries by queryFilter`, {cause: e})
        }

        let mapped
        try {
          mapped = filtered.map(queryMapper)
        } catch (e) {
          throw new Error(`Failed to map filtered entries by queryMapper`, {cause: e})
        }

        try {
          return querySort(mapped, entries)
        } catch (e) {
          throw new Error(`Failed to sort filtered entries by querySort`, {cause: e})
        }
      })
  }
}
