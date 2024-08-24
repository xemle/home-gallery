import path from 'path'
import t from 'tap'
import { fileURLToPath } from 'url'

import Logger from '@home-gallery/logger'
import { TExtractorEntry } from '@home-gallery/types'

import { PluginManager } from './manager.js'

import { createExtractorPlugin } from '../test-utils.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const testDir = path.resolve(__dirname, '..', '..', 'test')

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
    t.same(plugins.length, 7)
    t.ok(plugins.find(p => p.name == 'vanilla'))
    t.ok(plugins.find(p => p.name == 'acme'))
    t.ok(plugins.find(p => p.name == 'other'))
    t.ok(plugins.find(p => p.name == 'fancy'))
    t.ok(plugins.find(p => p.name == 'foo server'))
    t.ok(plugins.find(p => p.name == 'CommonJS Plugin'))
    t.ok(plugins.find(p => p.name == 'ESM Plugin'))
  })

  t.test('loadPlugins() with disabled plugins', async t => {
    const config = {
      pluginManager: {
        dirs: [path.resolve(testDir, 'plugins')],
        disabled: ['CommonJS Plugin', 'ESM Plugin', 'foo server']
      }
    }
    const manager = new PluginManager(config)


    await manager.loadPlugins()


    const plugins = manager.getPlugins()
    t.same(plugins.length, 4)
    t.ok(plugins.find(p => p.name == 'vanilla'))
    t.ok(plugins.find(p => p.name == 'acme'))
    t.ok(plugins.find(p => p.name == 'other'))
    t.ok(plugins.find(p => p.name == 'fancy'))
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

  t.test('getBrowserPlugins', async t => {
    const manager = new PluginManager({
      pluginManager: {plugins: [path.resolve(testDir, 'plugins', 'server-browser')]}
    })
    await manager.loadPlugins()


    const browserCtx = manager.getBrowserPlugins()


    t.same(browserCtx.plugins.length, 1)
    t.same(browserCtx.plugins[0].localDir, path.resolve(testDir, 'plugins', 'server-browser', 'dist', 'public'))
    t.same(browserCtx.plugins[0].publicPath, 'fooBrowser/')
    t.same(browserCtx.plugins[0].publicEntry, 'fooBrowser/index.js')
  })

  t.test('getBrowserPlugins invalid for file only imports', async t => {
    const manager = new PluginManager({
      pluginManager: {plugins: [path.resolve(testDir, 'plugins', 'browser-only', 'index.js')]}
    })
    await manager.loadPlugins()


    const browserCtx = manager.getBrowserPlugins()


    t.same(browserCtx.plugins.length, 0)
  })

  t.test('loadPlugins with directory() and browser only plugin', async t => {
    const manager = new PluginManager({
      pluginManager: {dirs: [path.resolve(testDir, 'plugins')]}
    })
    await manager.loadPlugins()


    const plugins = manager.getPlugins()
    const browserCtx = manager.getBrowserPlugins()


    t.same(plugins.length, 7)

    t.same(browserCtx.plugins.length, 2)
    t.same(browserCtx.plugins[0].localDir, path.resolve(testDir, 'plugins', 'browser-only'))
    t.same(browserCtx.plugins[0].publicPath, 'browserQuery/')
    t.same(browserCtx.plugins[0].publicEntry, 'browserQuery/index.js')
    t.same(browserCtx.plugins[1].localDir, path.resolve(testDir, 'plugins', 'server-browser', 'dist', 'public'))
    t.same(browserCtx.plugins[1].publicPath, 'fooBrowser/')
    t.same(browserCtx.plugins[1].publicEntry, 'fooBrowser/index.js')
  })

})
