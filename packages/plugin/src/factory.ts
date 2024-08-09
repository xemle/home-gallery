import { TDatabaseMapperStream, TExtractorStream, TExtractorStreamTearDown, TGalleryContext, TPlugin } from "@home-gallery/types"
import Logger from "@home-gallery/logger"

import { PluginManager } from "./manager/manager.js"
import { Storage } from "./manager/storage.js"

const log = Logger('pluginManager.factory')

export async function createPluginManager(config: any, context: TGalleryContext = {type: 'serverContext', plugin: {}}) {
  const t0 = Date.now()
  const manager = new PluginManager(config, context)
  const managerConfig = config?.pluginManager || {}

  const files = managerConfig.plugins || []
  const loadedFilePlugins: TPlugin[] = []
  for (let file of files) {
    await manager.loadPlugin(file)
      .then(plugin => plugin && loadedFilePlugins.push(plugin))
      .catch(err => {
        log.warn(err, `Failed to load plugin from file ${file}: ${err}`)
      })
  }
  if (files.length && loadedFilePlugins.length) {
    log.debug(`Loaded ${loadedFilePlugins.length} plugins from files: ${loadedFilePlugins.map(p => p.name).join(', ')}`)
  }

  const dirs = managerConfig.dirs || []
  for (let dir of dirs) {
    await manager.loadPluginDir(dir)
  }

  await manager.initializePlugins()
  log.info(t0, `Initialized plugin manager`)
  return manager
}

export async function createExtractorStreams(config: any): Promise<[TExtractorStream[], TExtractorStreamTearDown]> {
  const context: TGalleryContext = {
    type: 'extractorContext',
    plugin: {}
  }
  const manager = await createPluginManager(config, context)

  const storage = new Storage(config?.storage?.dir || '.')

  return manager.getExtractorStreams(storage)
}

export async function createDatabaseMapperStream(config: any): Promise<TDatabaseMapperStream> {
  const context: TGalleryContext = {
    type: 'databaseMapperContext',
    plugin: {}
  }
  const manager = await createPluginManager(config, context)

  const updated = config.database.updated || new Date().toISOString()
  return manager.getDatabaseMapperStream(updated)
}
