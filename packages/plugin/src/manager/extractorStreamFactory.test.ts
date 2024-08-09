import t from 'tap'
import { rm, access } from 'fs/promises'
import path from 'path'
import os from 'os'
import { Transform } from 'stream'


import Logger from '@home-gallery/logger'
import { TExtractor, TExtractorEntry, TPlugin } from "@home-gallery/types";
import { through } from '@home-gallery/stream'

import { ExtractorStreamFactory } from './extractorStreamFactory.js'
import { PluginManager } from './manager.js'
import { Storage } from './storage.js'

import { testEntryStream } from './test-utils.js'

Logger.addPretty('trace')
const log = Logger('plugin.streamFactory.test')

const stringifyName = name => `${name || 'test'}`
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

  t.test('getExtractorStreamsFrom from function only', async t => {
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


    const streams = await streamFactory.getExtractorStreamsFrom({} as TPlugin, [extractor])


    t.same(streams.length, 1)
    t.ok(streams[0]?.stream instanceof Transform)
    t.same(streams[0]?.extractor?.name, 'acme')

    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, 'foo')
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('getExtractorStreamsFrom from task only', async t => {
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


    const streams = await streamFactory.getExtractorStreamsFrom({} as TPlugin, [extractor])


    t.same(streams.length, 1)
    t.ok(streams[0]?.stream instanceof Transform)
    t.same(streams[0]?.extractor?.name, 'acme')

    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, 'foo')
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('getExtractorStreamsFrom from task and test', async t => {
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


    const streams = await streamFactory.getExtractorStreamsFrom({} as TPlugin, [extractor])


    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, undefined)
    t.same(data[1].meta.acme, 'foo')
  })

  t.test('getExtractorStreamsFrom from transform', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)
    const context = { manager, storage }

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const extractor: TExtractor = {
      name: 'acme',
      phase: 'file',
      async create() {
        return through((entry, _, cb) => {
          if (1 < +entry.sha1sum) {
            entry.meta.acme = 'bar'
          }
          cb(null, entry)
        })
      },
    }


    const streams = await streamFactory.getExtractorStreamsFrom({} as TPlugin, [extractor])


    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, undefined)
    t.same(data[1].meta.acme, 'bar')
  })

  t.test('getExtractorStreamsFrom invalid task is skipped', async t => {
    const manager = new PluginManager({})
    const storage = new Storage(storageDir)

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

    const invalidExtractor: TExtractor = {
      name: 'invalid',
      phase: 'file',
      async create() {
        return {
          invalid: 'This task is invalid'
        }
      },
    }

    const streams = await streamFactory.getExtractorStreamsFrom({} as TPlugin, [invalidExtractor])


    t.same(streams.length, 0)
  })


  t.test('getExtractorStreamsFrom failing create is skipped', async t => {
    const manager = new PluginManager()
    const storage = new Storage(storageDir)
    const context = { manager, storage }

    const streamFactory = new ExtractorStreamFactory(manager, storage, [])

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
        return through((entry, _, cb) => {
          if (1 < +entry.sha1sum) {
            entry.meta.acme = 'bar'
          }
          cb(null, entry)
        })
      },
    }


    const streams = await streamFactory.getExtractorStreamsFrom({} as TPlugin, [failingExtractor, extractor])


    t.same(streams.length, 1)

    const data = await testEntryStream(streams)
    t.same(data.length, 2)
    t.same(data[0].meta.acme, undefined)
    t.same(data[1].meta.acme, 'bar')
  })

})
