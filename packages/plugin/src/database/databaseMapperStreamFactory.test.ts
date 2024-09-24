import t from 'tap'

import { TStorageEntry } from '@home-gallery/types'

import { createDatabaseMapperStream } from './databaseMapperStreamFactory.js'
import { createDatabaseMapperPlugin, testDatabaseMapperStream } from '../test-utils.js'
import { PluginManager } from '../manager/manager.js'

t.test('createDatabaseMapperStream', async t => {
  const mapper = (entry: TStorageEntry, media: any) => { media.plugin.acme = 'foo' }
  const plugin = createDatabaseMapperPlugin('acme', mapper)

  const manager = new PluginManager()
  await manager.addPlugin(plugin)
  await manager.loadPlugins()


  const stream = await createDatabaseMapperStream(manager.getExtensions(), manager.getConfig(), '2024-07-29T22:03:48.098Z')


  const data = await testDatabaseMapperStream(stream)
  t.same(data.length, 2)
  t.same(data[0].plugin?.acme, 'foo')
  t.same(data[1].plugin?.acme, 'foo')
})