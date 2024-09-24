import { TDatabaseMapperStream, TExtractorStream, TExtractorStreamTearDown, TGalleryContext, TPlugin } from "@home-gallery/types"
import Logger from "@home-gallery/logger"

import { PluginManager } from "./manager/manager.js"
import { Storage } from "./extractor/storage.js"
import { ExtractorStreamFactory } from "./extractor/extractorStreamFactory.js"
import { createDatabaseMapperStream as createDatabaseMapperFactory } from "./database/databaseMapperStreamFactory.js"

const log = Logger('pluginManager.factory')

export async function createPluginManager(config: any, context: TGalleryContext = {type: 'serverContext', plugin: {}}) {
  const t0 = Date.now()
  const manager = new PluginManager(config, context)
  await manager.loadPlugins()
  const plugins = manager.getPlugins()
  log.info(t0, `Initialized plugin manager with ${plugins.length} plugins`)
  return manager
}

export async function createExtractorStreams(config: any): Promise<[TExtractorStream[], TExtractorStreamTearDown]> {
  const context: TGalleryContext = {
    type: 'extractorContext',
    plugin: {}
  }
  const manager = await createPluginManager(config, context)

  const storage = new Storage(config?.storage?.dir || '.')
  const streamFactory = new ExtractorStreamFactory(manager, storage, manager.getExtensions())
  return streamFactory.getExtractorStreams()
}

export async function createDatabaseMapperStream(config: any): Promise<TDatabaseMapperStream> {
  const context: TGalleryContext = {
    type: 'databaseMapperContext',
    plugin: {}
  }
  const manager = await createPluginManager(config, context)

  const updated = config.database.updated || new Date().toISOString()

  return createDatabaseMapperFactory(manager.getExtensions(), manager.getConfig(), updated)
}
