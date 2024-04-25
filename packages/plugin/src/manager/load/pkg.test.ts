import t from 'tap'

import { resolvePackageEntry } from './pkg.js'

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
