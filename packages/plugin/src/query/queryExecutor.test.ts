import t from 'tap'

import { QueryExecutor } from './queryExecutor.js'
import { TQueryPlugin, TAst, TQueryAst, TQueryContext } from '@home-gallery/types'
import { createQueryContext, createEntryMock } from './query-test-utils.js'

t.only('QueryExecutor', async t => {
  t.only('Executor is valid without plugins', async t => {
    const entries = [
      createEntryMock('1', {type: 'vide'}),
      createEntryMock('2'),
    ]

    const executor = new QueryExecutor()
    const context = createQueryContext()


    const filtered = await executor.execute(entries, 'type:image', context)


    t.same(filtered.length, 1)
    t.same(filtered[0].id, '2')
  })

  t.test('execute failes by unknown cmp key', async t => {
    const context = createQueryContext()
    const entries = [
      createEntryMock('1', {plugin: {acme: 'foo'}}),
      createEntryMock('2', {plugin: {acme: 'bar'}}),
    ]

    const executor = new QueryExecutor()

    t.rejects(executor.execute(entries, 'acme = bar', context))
  })

  t.test('add custom compare key', async t => {
    const executor = new QueryExecutor()

    const plugin: TQueryPlugin = {
      name: 'acme',
      queryHandler(ast: TQueryAst, context: TQueryContext) {
        // Create filter on acme keyword in condition to support 'acme = value' or 'acme:value'
        if (ast.type == 'cmp' && ast.key == 'acme', ast.op == '=') {
          ast.filter = (entry: any) => {
            // @ts-ignore
            return entry.plugin?.acme == ast?.value?.value
          }
          // The ast node could be handled. Return true to prevent further chain calls
          return true
        }
        return false
      }
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1', {plugin: {acme: 'a'}}),
      createEntryMock('2', {plugin: {acme: 'b'}}),
      createEntryMock('3', {plugin: {acme: 'c'}}),
    ]

    const context = createQueryContext()


    const filtered = await executor.execute(entries, 'acme = c', context)


    t.same(filtered.length, 1)
    t.same(filtered[0].id, '3')
  })

  t.test('add textFn', async t => {
    const executor = new QueryExecutor()

    const plugin: TQueryPlugin = {
      name: 'acme',
      textFn: (entry: any) => entry.plugin.acme
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1', {plugin: {acme: 'a'}}),
      createEntryMock('2', {plugin: {acme: 'b'}}),
      createEntryMock('3', {plugin: {acme: 'c'}}),
    ]

    const context = createQueryContext()


    const filtered = await executor.execute(entries, 'b', context)


    t.same(filtered.length, 1)
    t.same(filtered[0].id, '2')
  })

  t.test('add custom condition', async t => {
    const executor = new QueryExecutor()

    const insertHasNoTrashedTag = {
      transform(ast: TAst, context: TQueryContext) {
        if (ast.type == 'query') {
          const trashedValue: TAst = {type: 'identifier', value: 'trashed', col: ast.col}
          const tagCmp: TAst = {type: 'cmp', key: 'tag', op: '=', value: trashedValue, col: ast.col}
          const not: TAst = {type: 'not', value: tagCmp, col: ast.col}
          const and: TAst = {type: 'and', value: [ast.value as TAst, not], col: ast.col}
          ast.value = and
        }
        return ast
      }
    }

    const plugin: TQueryPlugin = {
      name: 'acme',
      transformRules: [
        insertHasNoTrashedTag
      ],
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1', {tags: ['HomeGallery']}),
      createEntryMock('2', {tags: ['PhotoPrism']}),
      createEntryMock('3', {tags: ['GoolePhotos', 'trashed']}),
      createEntryMock('4', {tags: ['Immich']}),
    ]

    const context = createQueryContext()


    const filtered = await executor.execute(entries, '', context)


    t.same(filtered.length, 3)
    t.same(filtered[0].id, '1')
    t.same(filtered[1].id, '2')
    t.same(filtered[2].id, '4')
  })

  t.only('add custom condition conditionaly', async t => {
    const executor = new QueryExecutor()

    const isAst = (ast: any): boolean => ast?.type && typeof ast.col == 'number'

    const findAst = (ast: any, fn: (ast: any) => boolean) => {
      if (!isAst(ast)) {
        return false
      } else if (fn(ast)) {
        return true
      } else if (ast.orderBy && findAst(ast.orderBy, fn)) {
        return true
      } else if (Array.isArray(ast.value)) {
        return ast.value.find((child: any) => findAst(child, fn))
      } else if (ast.value) {
        return findAst(ast.value, fn)
      }
    }

    const isTagTrashed = (ast: any) => ast.type == 'cmp' && ast.key == 'tag' && ast.op == '=' && ast.value?.value == 'trashed'

    const insertHasNoTrashedTagIfNotQueried = {
      transform(ast: TAst, context: TQueryContext) {
        if (ast.type == 'query' && !findAst(ast, isTagTrashed)) {
          const trashedValue: TAst = {type: 'identifier', value: 'trashed', col: ast.col}
          const tagCmp: TAst = {type: 'cmp', key: 'tag', op: '=', value: trashedValue, col: ast.col}
          const not: TAst = {type: 'not', value: tagCmp, col: ast.col}
          ast.value = ast.value ? {type: 'and', value: [ast.value as TAst, not], col: ast.col} : not
        }
        return ast
      }
    }

    const plugin: TQueryPlugin = {
      name: 'acme',
      transformRules: [
        insertHasNoTrashedTagIfNotQueried
      ],
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1', {tags: ['HomeGallery']}),
      createEntryMock('2', {tags: ['PhotoPrism']}),
      createEntryMock('3', {tags: ['GoolePhotos', 'trashed']}),
      createEntryMock('4', {tags: ['Immich']}),
    ]

    const context = createQueryContext()


    const notTrashedEntriesByDefault = await executor.execute(entries, '', context)
    const trashedEntries = await executor.execute(entries, 'tag = trashed', context)


    t.same(notTrashedEntriesByDefault.map((e: any) => e.id), ['1', '2', '4'])

    t.same(trashedEntries.length, 1)
    t.same(trashedEntries[0].id, '3')
  })

  t.test('change default sort order', async t => {
    const executor = new QueryExecutor()

    const setDefaultOrderToHeight = {
      transform(ast: TAst, context: TQueryContext) {
        if (ast.type == 'query') {
          const orderKey: TAst = {type: 'orderKey', value: 'height', col: ast.col}
          const orderBy: TAst = {type: 'orderBy', value: orderKey, col: ast.col}
          ast.orderBy = orderBy
        }
        return ast
      }
    }

    const plugin: TQueryPlugin = {
      name: 'acme',
      transformRules: [
        setDefaultOrderToHeight
      ],
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1', {height: 3000}),
      createEntryMock('2', {height: 1920}),
      createEntryMock('3', {height: 4200}),
    ]

    const context = createQueryContext()


    const filtered = await executor.execute(entries, '', context)


    t.same(filtered.length, 3)
    t.same(filtered[0].id, '3')
    t.same(filtered[1].id, '1')
    t.same(filtered[2].id, '2')
  })

  t.test('add custom sort key', async t => {
    const executor = new QueryExecutor()

    const plugin: TQueryPlugin = {
      name: 'acme',
      queryHandler(ast: TQueryAst, context: TQueryContext) {
        if (ast.type == 'orderKey' && ast.value == 'acmeScore') {
          ast.scoreFn = e => +e.plugin.acme || 0
          ast.direction = 'desc'
          return true
        }
        return false
      }
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1', {plugin: {acme: 2}}),
      createEntryMock('2', {plugin: {acme: 5}}),
      createEntryMock('3', {plugin: {acme: 1}}),
    ]

    const context = createQueryContext()


    const filtered = await executor.execute(entries, 'order by acmeScore', context)


    t.same(filtered.length, 3)
    t.same(filtered[0].id, '2')
    t.same(filtered[1].id, '1')
    t.same(filtered[2].id, '3')
  })

  t.test('add custom mapper', async t => {
    const executor = new QueryExecutor()

    const plugin: TQueryPlugin = {
      name: 'acme',
      transformRules: [
        {
          transform(ast, context) {
            if (ast.type == 'query') {
              const origMapper = ast.mapper || (e => e)
              ast.mapper = e => {
                const mapped = origMapper(e)
                return {...mapped, acme: true}
              }
            }
            return ast
          }
        }
      ]
    }

    executor.addQueryPlugins([plugin])

    const entries = [
      createEntryMock('1'),
      createEntryMock('2'),
    ]

    const context = createQueryContext()


    const filtered = await executor.execute(entries, '', context)


    t.same(filtered.length, 2)
    t.same(filtered[0].id, '1')
    t.same(filtered[0].acme, true)
    t.same(filtered[1].id, '2')
    t.same(filtered[1].acme, true)
  })
})

