import { TDatabaseMapperStream, TExtractorStream, TExtractorStreamTearDown, TPlugin } from "@home-gallery/types"
import Logger from "@home-gallery/logger"

import { PluginManager } from "./manager/manager.js"
import { Storage } from "./manager/storage.js"

const log = Logger('pluginManager.factory')

export async function createPluginManager(options: any) {
  const t0 = Date.now()
  const manager = new PluginManager(options.config)
  const managerConfig = options?.config?.pluginManager || {}

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

export async function createExtractorStreams(options: any): Promise<[TExtractorStream[], TExtractorStreamTearDown]> {
  const manager = await createPluginManager(options)

  const storage = new Storage(options.config?.storage?.dir || '.')

  return manager.getExtractorStreams(storage)
}

export async function createDatabaseMapperStream(options: any): Promise<TDatabaseMapperStream> {
  const manager = await createPluginManager(options)

  const updated = options.config.database.updated || new Date().toISOString()
  return manager.getDatabaseMapperStream(updated)
}
