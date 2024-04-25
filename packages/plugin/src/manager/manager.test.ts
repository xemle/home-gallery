import path from 'path'
import t from 'tap'
import { fileURLToPath } from 'url'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import Logger from '@home-gallery/logger'
import { toList, write } from '@home-gallery/stream'
import { TExtractorEntry, TExtractorStream, TExtractorFunction, TExtractor, TPlugin, TStorageEntry } from '@home-gallery/types'

import { PluginManager } from './manager.js'
import { Storage } from './storage.js'

import { testEntryStream, createPlugin, testDatabaseMapperStream, createDatabaseMapperPlugin, createExtractorPlugin } from './test-utils.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const testDir = path.resolve(__dirname, '..', '..', 'test')

Logger.addPretty('trace')
const log = Logger('pluginManager.test')

t.only('PluginManager', async t => {
  t.test('getPlugins()', async t => {
    const manager = new PluginManager()


    t.same(manager.getPlugins().length, 0)
  })

  t.test('loadPlugin() from file', async t => {
    const manager = new PluginManager()


    await manager.loadPlugin(path.resolve(testDir, 'plugins', 'vanilla', 'index.js'))
    await manager.initializePlugins()


    const plugin = manager.getPlugin('vanilla')
    t.ok(plugin)
    t.same(plugin?.name, 'vanilla')
    t.same(plugin?.version, '1.0')
  })

  t.test('loadPlugin() from dir', async t => {
    const manager = new PluginManager()


    await manager.loadPlugin(path.resolve(testDir, 'plugins', 'vanilla'))
    await manager.initializePlugins()


    const plugin = manager.getPlugin('vanilla')
    t.ok(plugin)
    t.same(plugin?.name, 'vanilla')
    t.same(plugin?.version, '1.0')
  })

  t.test('loadPlugin() from package dir', async t => {
    const manager = new PluginManager()


    await manager.loadPlugin(path.resolve(testDir, 'plugins', 'acme'))
    await manager.initializePlugins()


    const plugin = manager.getPlugin('acme')
    t.ok(plugin)
    t.same(plugin?.name, 'acme')
    t.same(plugin?.version, '1.0')
  })

  t.test('loadPluginDir()', async t => {
    const manager = new PluginManager()


    await manager.loadPluginDir(path.resolve(testDir, 'plugins'))
    await manager.initializePlugins()


    t.same(manager.getPlugins().length, 6)
    t.same(manager.getPlugin('vanilla')?.name, 'vanilla')
    t.same(manager.getPlugin('acme')?.name, 'acme')
    t.same(manager.getPlugin('other')?.name, 'other')
    t.same(manager.getPlugin('fancy')?.name, 'fancy')
    t.same(manager.getPlugin('CommonJS Plugin')?.name, 'CommonJS Plugin')
    t.same(manager.getPlugin('ESM Plugin')?.name, 'ESM Plugin')
  })

  t.test('loadPluginDir() with disabled plugins', async t => {
    const config = {
      pluginManager: {
        disabled: ['CommonJS Plugin', 'ESM Plugin']
      }
    }
    const manager = new PluginManager(config)


    await manager.loadPluginDir(path.resolve(testDir, 'plugins'))
    await manager.initializePlugins()


    t.same(manager.getPlugins().length, 4)
    t.same(manager.getPlugin('vanilla')?.name, 'vanilla')
    t.same(manager.getPlugin('acme')?.name, 'acme')
    t.same(manager.getPlugin('other')?.name, 'other')
    t.same(manager.getPlugin('fancy')?.name, 'fancy')
  })

  t.test('getModuleFactoryFor()', async t => {
    const extractorTask = async (entry: TExtractorEntry) => { entry.meta.acme = 'foo' }
    const plugin = createExtractorPlugin('acme', extractorTask)

    const manager = new PluginManager()
    await manager.addPlugin('dummy.file', plugin)
    await manager.initializePlugins()


    const factory = manager.getModuleFactoryFor('acmePlugin')
    const extractors = factory?.getExtractors?.()
    t.ok(factory)
    t.same(extractors?.length, 1)
  })

  t.test('getExtractorStreams', async t => {
    const extractorTask = async (entry: TExtractorEntry) => { entry.meta.acme = 'foo' }
    const plugin = createExtractorPlugin('acme', extractorTask)

    const manager = new PluginManager()
    await manager.addPlugin('dummy.file', plugin)
    await manager.initializePlugins()

    const storage = new Storage('.')


    const [streams] = await manager.getExtractorStreams(storage)


    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, 'foo')
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('getExtractorStreams with disabled extractor', async t => {
    const extractorTask = async (entry: TExtractorEntry) => { entry.meta.acme = 'foo' }
    const plugin = createExtractorPlugin('acme', extractorTask)

    const config = {
      pluginManager: {
        disabledExtractors: ['acmeExtractor']
      }
    }
    const manager = new PluginManager(config)
    await manager.addPlugin('dummy.file', plugin)
    await manager.initializePlugins()

    const storage = new Storage('.')


    const [streams] = await manager.getExtractorStreams(storage)


    t.same(streams.length, 0)
  })


  t.test('getDatabaseMapperStream', async t => {
    const mapper = (entry: TStorageEntry, media: any) => { media.plugin.acme = 'foo' }
    const plugin = createDatabaseMapperPlugin('acme', mapper)

    const manager = new PluginManager()
    await manager.addPlugin('dummy.file', plugin)
    await manager.initializePlugins()


    const stream = await manager.getDatabaseMapperStream('2024-07-29T22:03:48.098Z')


    const data = await testDatabaseMapperStream(stream)
    t.same(data.length, 2)
    t.same(data[0].plugin?.acme, 'foo')
    t.same(data[1].plugin?.acme, 'foo')
  })

})
