import t from 'tap'

import Logger from '@home-gallery/logger'
Logger.addPretty('trace')

import { TPluginContext } from '../types.js'
import { resolve } from './resolve.js'

const mockPlugin = (nameVersion: string, deps: string[] = []) => {
  let [name, version] = nameVersion.split('@')
  version = version || '1.0'
  return {
    file: name,
    plugin: {
      name,
      version,
      requires: deps
    }
  } as TPluginContext
}

t.test('resolve', async t => {
  t.test('single plugin', async t => {
    const plugins = [mockPlugin('vanilla')]

    
    const ordered = resolve(plugins)

    
    const names = ordered.map(ctx => ctx.plugin.name)
    t.same(names, ['vanilla'])
  })

  t.test('multiple plugins with no dependencies reserves order', async t => {
    const plugins = [mockPlugin('vanilla'), mockPlugin('acme')]

    
    const ordered = resolve(plugins)

    
    const names = ordered.map(ctx => ctx.plugin.name)
    t.same(names, ['vanilla', 'acme'])
  })

  t.test('resolve dependency', async t => {
    const plugins = [mockPlugin('vanilla', ['acme']), mockPlugin('acme')]

    
    const ordered = resolve(plugins)

    
    const names = ordered.map(ctx => ctx.plugin.name)
    t.same(names, ['acme', 'vanilla'])
  })

  t.test('resolve 2 dependencies', async t => {
    const plugins = [mockPlugin('vanilla', ['acme']), mockPlugin('acme', ['other']), mockPlugin('other')]

    
    const ordered = resolve(plugins)

    
    const names = ordered.map(ctx => ctx.plugin.name)
    t.same(names, ['other', 'acme', 'vanilla'])
  })

  t.test('fail on cyclic dependencies', async t => {
    const plugins = [mockPlugin('vanilla', ['acme']), mockPlugin('acme', ['other', 'vanilla']), mockPlugin('other')]

    
    try {
      resolve(plugins)
      t.fail()
    } catch (err) {
      t.same(err.name, 'acme')
      t.same(err.missingDep, 'vanilla')
    }
  })

  t.test('success on matching semVer', async t => {
    const plugins = [mockPlugin('vanilla', ['acme@1.2.1']), mockPlugin('acme@1.3')]

    
    const ordered = resolve(plugins)

    
    const names = ordered.map(ctx => ctx.plugin.name)
    t.same(names, ['acme', 'vanilla'])
  })

  t.test('fail on wrong semVer', async t => {
    const plugins = [mockPlugin('vanilla', ['acme@1.2']), mockPlugin('acme@1.1')]

    
    try {
      resolve(plugins)
      t.fail()
    } catch (err) {
      t.same(err.name, 'vanilla')
      t.same(err.missingDep, 'acme@1.2')
    }
  })
})
