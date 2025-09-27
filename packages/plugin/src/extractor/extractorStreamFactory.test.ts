import t from 'tap'
import { rm, access } from 'fs/promises'
import path from 'path'
import os from 'os'
import { Transform } from 'stream'


import Logger from '@home-gallery/logger'
import { TExtractor, TExtractorEntry, TPlugin, TPluginExtension } from "@home-gallery/types";
import { through } from '@home-gallery/stream'

import { ExtractorStreamFactory } from './extractorStreamFactory.js'
import { PluginManager } from '../manager/manager.js'
import { Storage } from './storage.js'

import { createExtractorPlugin, testEntryStream } from '../test-utils.js'

Logger.addPretty('trace')
const log = Logger('plugin.streamFactory.test')

const stringifyName = (name: string) => `${name || 'test'}`
  .replaceAll(/[^A-Za-z0-9]+/g, '-') // all special chars to -
  .replaceAll(/(^[-]+|[-]+$)/g, '') // trim - chars

t.only('StreamFactory', async t => {
  let baseTmp = path.resolve(os.tmpdir(), 'gallery-test-plugin-stream-factory')
  let storageDir = baseTmp

  t.beforeEach(async () => {
    if (!t.parent) {
      return
    }

    storageDir = path.join(baseTmp, stringifyName(t.name), 'storage')
  })

  t.after(async () => {
    await access(baseTmp)
      .then(() => rm(baseTmp, {recursive: true}))
      .catch(() => true)
  })

  t.test('toStream from function only', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const extractor: TExtractor = {
      name: 'acme',
      phase: 'file',
      create: async () => entry => {
        entry.meta.acme = 'foo'
      },
    }


    const stream = await streamFactory.toStream({} as TPlugin, extractor)


    t.ok(stream)
    t.ok(stream.stream instanceof Transform)
    t.same(stream.extractor?.name, 'acme')

    const data = await testEntryStream([stream])
    t.same(data.length, 2)
    t.same(data[0].meta.acme, 'foo')
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('toStream from task only', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)
    const context = { manager, storage }

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const extractor: TExtractor = {
      name: 'acme',
      phase: 'file',
      async create() {
        return {
          async task(entry: TExtractorEntry) {
            entry.meta.acme = 'foo'
          }
        }
      },
    }


    const stream = await streamFactory.toStream({} as TPlugin, extractor)


    t.ok(stream)
    t.ok(stream.stream instanceof Transform)
    t.same(stream.extractor?.name, 'acme')

    const data = await testEntryStream([stream])
    t.same(data.length, 2)
    t.same(data[0].meta.acme, 'foo')
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('toStream from task and test', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)
    const context = { manager, storage }

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const extractor: TExtractor = {
      name: 'acme',
      phase: 'file',
      async create() {
        return {
          test(entry: TExtractorEntry) {
            return 1 < +entry.sha1sum
          },
          async task(entry: TExtractorEntry) {
            entry.meta.acme = 'foo'
          }
        }
      },
    }


    const stream = await streamFactory.toStream({} as TPlugin, extractor)


    const data = await testEntryStream([stream])
    t.same(data.length, 2)
    t.same(data[0].meta.acme, undefined)
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('toStream from transform', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)
    const context = { manager, storage }

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const extractor: TExtractor = {
      name: 'acme',
      phase: 'file',
      async create() {
        return through((entry: TExtractorEntry, _: any, cb: (err?: any, result?: any) => void) =>  {
          if (1 < +entry.sha1sum) {
            entry.meta.acme = 'bar'
          }
          cb(null, entry)
        })
      },
    }


    const stream = await streamFactory.toStream({} as TPlugin, extractor)


    const data = await testEntryStream([stream])
    t.same(data.length, 2)
    t.same(data[0].meta.acme, undefined)
    t.same(data[1].meta.acme, 'bar')
  })

  t.test('toStream invalid task is skipped', async t => {
    const manager = new PluginManager({})
    const storage = new Storage(storageDir)

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const invalidExtractor: TExtractor = {
      name: 'invalid',
      phase: 'file',
      // @ts-ignore
      async create() {
        return {
          invalid: 'This task is invalid'
        }
      },
    }


    t.rejects(streamFactory.toStream({} as TPlugin, invalidExtractor))
  })


  t.test('getExtractorStreamsFrom failing create is skipped', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)
    const context = { manager, storage }

    const failingExtractor: TExtractor = {
      name: 'fancy',
      phase: 'file',
      async create() {
        throw new Error(`This plugin fails`)
      },
    }
    const extractor: TExtractor = {
      name: 'acme',
      phase: 'file',
      async create() {
        return through((entry: any, _: any, cb: (err?: any, result?: any) => void) => {
          if (1 < +entry.sha1sum) {
            entry.meta.acme = 'bar'
          }
          cb(null, entry)
        })
      },
    }

    const extensions: TPluginExtension[] = [failingExtractor, extractor].map(extension => ({plugin: {} as TPlugin, type: 'extractor', extension}))
    const streamFactory = new ExtractorStreamFactory(manager, storage, extensions)



    const [streams] = await streamFactory.getExtractorStreams()


    t.same(streams.length, 1)

    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, undefined)
    t.same(data[1].meta.acme, 'bar')
  })

  t.test('getExtractorStreams', async t => {
    const extractorTask = async (entry: TExtractorEntry) => { entry.meta.acme = 'foo' }
    const plugin = createExtractorPlugin('acme', extractorTask)

    const manager = new PluginManager()
    await manager.addPlugin(plugin)
    await manager.loadPlugins()

    const storage = new Storage('.')


    const streamFactory = new ExtractorStreamFactory(manager, storage, manager.getExtensions())
    const [streams] = await streamFactory.getExtractorStreams()


    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, 'foo')
    t.same(data[1].meta.acme, 'foo')
  })

})
