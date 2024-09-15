import t from 'tap'

import { resolveBrowserEntry, resolvePackageEntry } from './pkg.js'

t.test('resolvePackageEntry', async t => {
  t.test('main', async t => {
    const entry = resolvePackageEntry({main: 'index.js'})


    t.same(entry, 'index.js')
  })

  t.test('exports.node.module', async t => {
    const entry = resolvePackageEntry({exports: {node: {module: 'dist/index.mjs'}}})


    t.same(entry, 'dist/index.mjs')
  })

  t.test('exports.\'.\'.node', async t => {
    const entry = resolvePackageEntry({exports: {'.': {node: 'dist/index.js'}}})


    t.same(entry, 'dist/index.js')
  })
})

t.test('resolveBrowserEntry', async t => {
  t.test('browser', async t => {
    const entry = resolveBrowserEntry({browser: 'index.js'})


    t.ok(entry)
  })

  t.test('only main should return falsy', async t => {
    const entry = resolveBrowserEntry({main: 'index.js'})


    t.notOk(entry)
  })

  t.test('exports.node.module', async t => {
    const entry = resolveBrowserEntry({exports: {node: {module: 'dist/index.mjs'}, 'browser': 'dist/public/index.js'}})


    t.same(entry, 'dist/public/index.js')
  })
})
