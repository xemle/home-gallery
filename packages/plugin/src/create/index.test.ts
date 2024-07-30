import { access } from 'fs/promises'
import path from 'path'
import os from 'os'
import t from 'tap'

import Logger from '@home-gallery/logger'

import { createPlugin } from './index.js'
import { PluginManager, Storage } from '../manager/index.js'
import { TGalleryConfig } from '@home-gallery/types'

const testDir = path.resolve(os.tmpdir(), 'gallery-unit', `run-${process.pid}`)

Logger.addPretty('trace')

const stringifyName = name => `${name || 'test'}`
  .replaceAll(/[^A-Za-z0-9]+/g, '-') // all special chars to -
  .replaceAll(/(^[-]+|[-]+$)/g, '') // trim - chars

const accessAll = (base: string, files: string[], status : 'fulfilled' | 'rejected' = 'fulfilled') => {
  return Promise.allSettled(files.map(file => access(path.join(base, file))))
    .then(result => result.filter((fileResult) => fileResult.status == status))
    .then(result => {
      if (result.length != files.length) {
        throw new Error(`Expected ${files.length} to be ${status}, but was ${result.length}`)
      }
    })
}

t.only('createPlugin', async t => {
  let baseDir = testDir
  let storageDir = testDir

  t.beforeEach(async (t) => {
    if (!t.parent) {
      return
    }
    baseDir = path.join(testDir, stringifyName(t.parent?.name), stringifyName(t.name))
    storageDir = path.join(baseDir, 'storage')
  })

  t.afterEach(async (t) => {
    if (!t.parent) {
      return
    }
    //return fs.rm(outDir, {recursive: true})
  })

  t.test('vanilla files with only extractor', async t => {
    await createPlugin({ config: { createPlugin: {
      name: 'acme',
      baseDir,
      sourceType: 'vanilla',
      requires: [],
      modules: ['extractor']
    }}})


    const files = [
      'package.json',
      'src/index.js',
      'src/factory.js',
      'src/extractor/index.js'
    ]
    const missingFiles = [
      'src/database/index.js'
    ]

    const pluginBase = path.join(baseDir, 'acme')
    t.ok(accessAll(pluginBase, files))
    t.ok(accessAll(pluginBase, missingFiles, 'rejected'))
  })

  t.test('vanilla files with only database', async t => {
    await createPlugin({ config: { createPlugin: {
      name: 'acme',
      baseDir,
      sourceType: 'vanilla',
      requires: [],
      modules: ['database']
    }}})


    const files = [
      'package.json',
      'src/index.js',
      'src/factory.js',
      'src/database/index.js'
    ]
    const missingFiles = [
      'src/extractor/index.js'
    ]

    const pluginBase = path.join(baseDir, 'acme')
    t.ok(accessAll(pluginBase, files))
    t.ok(accessAll(pluginBase, missingFiles, 'rejected'))

    const manager = new PluginManager()
    await manager.loadPlugin(path.join(baseDir, 'acme'))
    await manager.initializePlugins()

    t.same(manager.getPlugins().length, 1)
    t.same(manager.getPlugin('acmePlugin')?.name, 'acmePlugin')
  })

  t.test('vanilla plugin loads', async t => {
    await createPlugin({ config: { createPlugin: {
      name: 'acme',
      baseDir,
      sourceType: 'vanilla',
      requires: [],
      modules: ['extractor', 'database']
    }}})


    const pluginDir = path.join(baseDir, 'acme')
    const manager = new PluginManager()
    await manager.loadPlugin(pluginDir)
    await manager.initializePlugins()


    t.same(manager.getPlugins().length, 1)
    t.same(manager.getPlugin('acmePlugin')?.name, 'acmePlugin')
  })

  t.test('vanilla plugin extractors', async t => {
    await createPlugin({ config: { createPlugin: {
      name: 'acme',
      baseDir,
      sourceType: 'vanilla',
      requires: [],
      modules: ['extractor', 'database']
    }}})


    const pluginDir = path.join(baseDir, 'acme')
    const manager = new PluginManager()
    const storage = new Storage(storageDir)

    await manager.loadPlugin(pluginDir)
    await manager.initializePlugins()


    const [streams] = await manager.getExtractorStreams(storage)


    t.same(streams.length, 1)
    t.same(streams[0].plugin.name, 'acmePlugin')
  })

  t.test('vanilla database mappers', async t => {
    await createPlugin({ config: { createPlugin: {
      name: 'acme',
      baseDir,
      sourceType: 'vanilla',
      requires: [],
      modules: ['extractor', 'database']
    }}})


    const manager = new PluginManager()
    await manager.loadPlugin(path.join(baseDir, 'acme'))
    await manager.initializePlugins()


    const mapperStream = await manager.getDatabaseMapperStream(new Date().toISOString())
    t.same(mapperStream.entries?.length, 1)
    t.ok(mapperStream.stream)
  })
})
