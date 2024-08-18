import path from 'path'
import t from 'tap'
import { fileURLToPath } from 'url'

import Logger from '@home-gallery/logger'
import { TExtractorEntry } from '@home-gallery/types'

import { PluginManager } from './manager.js'

import { createPlugin,createExtractorPlugin, createQueryPlugin } from '../test-utils.js'
import { createQueryContext, createEntryMock } from '../query/query-test-utils.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const testDir = path.resolve(__dirname, '..', '..', 'test')

Logger.addPretty('trace')
const log = Logger('pluginManager.test')

t.only('PluginManager', async t => {
  t.test('getPlugins()', async t => {
    const manager = new PluginManager()


    t.same(manager.getPlugins().length, 0)
  })

  t.test('loadPlugins() from file', async t => {
    const manager = new PluginManager({
      pluginManager: {plugins: [path.resolve(testDir, 'plugins', 'vanilla', 'index.js')]}
    })


    await manager.loadPlugins()


    const plugin = manager.getPlugins().find(p => p.name == 'vanilla')
    t.ok(plugin)
    t.same(plugin?.name, 'vanilla')
    t.same(plugin?.version, '1.0')
  })

  t.test('loadPlugins() from dir', async t => {
    const manager = new PluginManager({
      pluginManager: {plugins: [path.resolve(testDir, 'plugins', 'vanilla')]}
    })


    await manager.loadPlugins()


    const plugin = manager.getPlugins().find(p => p.name == 'vanilla')
    t.ok(plugin)
    t.same(plugin?.name, 'vanilla')
    t.same(plugin?.version, '1.0')
  })

  t.test('loadPlugins() from package dir', async t => {
    const manager = new PluginManager({
      pluginManager: {plugins: [path.resolve(testDir, 'plugins', 'acme')]}
    })


    await manager.loadPlugins()


    const plugin = manager.getPlugins().find(p => p.name == 'acme')
    t.ok(plugin)
    t.same(plugin?.name, 'acme')
    t.same(plugin?.version, '1.0')
  })

  t.test('loadPlugins with directory()', async t => {
    const manager = new PluginManager({
      pluginManager: {dirs: [path.resolve(testDir, 'plugins')]}
    })


    await manager.loadPlugins()


    const plugins = manager.getPlugins()
    t.same(plugins.length, 6)
    t.same(plugins.find(p => p.name == 'vanilla')?.name, 'vanilla')
    t.same(plugins.find(p => p.name == 'acme')?.name, 'acme')
    t.same(plugins.find(p => p.name == 'other')?.name, 'other')
    t.same(plugins.find(p => p.name == 'fancy')?.name, 'fancy')
    t.same(plugins.find(p => p.name == 'CommonJS Plugin')?.name, 'CommonJS Plugin')
    t.same(plugins.find(p => p.name == 'ESM Plugin')?.name, 'ESM Plugin')
  })

  t.test('loadPlugins() with disabled plugins', async t => {
    const config = {
      pluginManager: {
        dirs: [path.resolve(testDir, 'plugins')],
        disabled: ['CommonJS Plugin', 'ESM Plugin']
      }
    }
    const manager = new PluginManager(config)


    await manager.loadPlugins()


    const plugins = manager.getPlugins()
    t.same(plugins.length, 4)
    t.same(plugins.find(p => p.name == 'vanilla')?.name, 'vanilla')
    t.same(plugins.find(p => p.name == 'acme')?.name, 'acme')
    t.same(plugins.find(p => p.name == 'other')?.name, 'other')
    t.same(plugins.find(p => p.name == 'fancy')?.name, 'fancy')
  })

  t.test('getExtensions()', async t => {
    const extractorTask = async (entry: TExtractorEntry) => { entry.meta.acme = 'foo' }
    const plugin = createExtractorPlugin('acme', extractorTask)

    const manager = new PluginManager()
    await manager.addPlugin(plugin)
    await manager.loadPlugins()


    const extensions = manager.getExtensions()
    t.ok(extensions)
    t.same(extensions?.length, 1)
  })

})
