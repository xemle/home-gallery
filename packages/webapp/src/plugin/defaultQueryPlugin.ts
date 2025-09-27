import type { TAst, TPlugin, TPluginManager, TQueryPlugin } from "@home-gallery/types";

const yearQuery: TQueryPlugin = {
  name: 'year',
  transformRules: [{
    types: ['query'],
    transform(ast, context) {
      if (!context.plugin.year?.value) {
        // no year query
        return ast
      }

      const orderKey: TAst = {type: 'orderKey', value: 'date', col: ast.col}
      const orderBy: TAst = ast.orderBy ? ast.orderBy : {type: 'orderBy', value: orderKey, direction: 'asc', col: ast.col}
      const comboundKey: TAst = {type: 'comboundValue', value: context.plugin.year.value, col: ast.col}
      const keyValue: TAst = {type: 'keyValue', key: 'year', value: comboundKey, col: ast.col}

      if (ast.value?.type == 'noop') {
        // empty query
        return {...ast, value: keyValue, orderBy}
      }

      const and: TAst = {type: 'and', value: [keyValue, ast.value as TAst], col: ast.col}
      return {...ast, value: and, orderBy}
    }
  }]
}

const defaultOrder: TQueryPlugin = {
  name: 'defaultOrder',
  order: 90,
  transformRules: [{
    types: ['query'],
    transform(ast, context) {
      if (ast.orderBy) {
        return ast
      }

      const orderKey: TAst = {type: 'orderKey', value: 'date', col: ast.col}
      const orderBy: TAst = {type: 'orderBy', value: orderKey, direction: 'desc', col: ast.col}

      return {...ast, orderBy}
    }
  }]
}

const DefaultQueryPlugin: TPlugin = {
  name: 'default',
  version: '1.0',
  async initialize(manager: TPluginManager) {
    manager.register('query', yearQuery)
    manager.register('query', defaultOrder)
  }
}

export default DefaultQueryPlugin