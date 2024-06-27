import t from 'tap'

import { defaultExcludeFileFilter, createIncludeFileFilter } from './package-file-filter.js'

const filterFromPkg = (pkg: any = {}) => createIncludeFileFilter(pkg)

const filterFromFiles = (files: string[]) => filterFromPkg({files})


t.test('Package file filter', async t => {
  let filter

  t.test('exclude defaults', async t => {
    filter = defaultExcludeFileFilter
    t.equal(filter('node_modules'), false)
    t.equal(filter('node_modules/a'), false)
    t.equal(filter('.git'), false)
    t.equal(filter('.git/config'), false)
  })

  t.test('allow all files', async t => {
    filter = filterFromPkg()
    t.equal(filter('vendor'), true)
    t.equal(filter('lib'), true)
    t.equal(filter('lib/index.js'), true)
  })

  t.test('white listed files with given files', async t => {
    filter = filterFromFiles(['lib'])
    t.equal(filter('README'), true)
    t.equal(filter('LICENCE'), true)
  })

  t.test('allow simple directory', async t => {
    filter = filterFromFiles(['lib'])
    t.equal(filter('lib'), true)
    t.equal(filter('lib/index.js'), true)
    t.equal(filter('vendor'), false)
  })

  t.test('allow tailing slash directory', async t => {
    filter = filterFromFiles(['lib/'])
    t.equal(filter('lib'), true)
    t.equal(filter('lib/index.js'), true)
    t.equal(filter('vendor'), false)
  })

  t.test('nested file', async t => {
    filter = filterFromFiles(['lib/index.js'])
    t.equal(filter('lib'), false)
    t.equal(filter('lib/index.js'), true)
    t.equal(filter('vendor'), false)
  })
})

