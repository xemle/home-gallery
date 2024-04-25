import Logger from "@home-gallery/logger";
import { TDatabaseMapper, TDatabaseMapperEntry, TModuleFactory, TPlugin, TStorageEntry, TGalleryConfig } from "@home-gallery/types";
import { through } from "@home-gallery/stream";
import { serialize, createHash } from '@home-gallery/common';

import { TPluginContext } from "./types";

const log = Logger('plugin.databaseMapperFactory')

const validateMapper = (mapper: TDatabaseMapper) => {
  return typeof mapper.name == 'string' && typeof mapper.mapEntry == 'function'
}

export const getDatabaseMapper = (plugin: TPlugin, factory: TModuleFactory, disabledMappers: string[]) => {
  const mappers = factory.getDatabaseMappers!()
  if (!mappers?.length) {
    return []
  }

  const mapperEntries = [] as TDatabaseMapperEntry[]
  for (let databaseMapper of mappers) {
    if (disabledMappers.includes(databaseMapper.name)) {
      log.info(`Disable database mapper ${databaseMapper.name} from ${plugin.name}`)
      continue
    } else if (!validateMapper(databaseMapper)) {
      log.warn(`Invalid database mapper ${databaseMapper.name} from plugin ${plugin.name}. Ignore it`)
      continue
    }
    
    mapperEntries.push({
      databaseMapper,
      plugin
    })
  }

  return mapperEntries.sort((a, b) => {
    const aOrder = a.databaseMapper.order || 1
    const bOrder = b.databaseMapper.order || 1
    return aOrder <= bOrder ? -1 : 1
  })
}

export const createStream = (mapperEntries: TDatabaseMapperEntry[], config: TGalleryConfig, updated: string) => {
  const stream = through((entry: TStorageEntry, _: any, cb: (err?: any, data?: any) => void) => {
    let media = {
      id: entry.sha1sum,
      hash: '',
      type: entry.type,
      date: '',
      updated,
      files: [],
      previews: [],
      plugin: {}
    }

    for (let mapperEntry of mapperEntries) {
      const mapper = mapperEntry.databaseMapper
      try {
        const result = mapper.mapEntry?.(entry, media, config)
        if (result && typeof result == 'object') {
          media = result
        }
      } catch (err) {
        log.warn(err, `Database mapper ${mapper.name} from plugin ${mapperEntry.plugin.name} failed: ${err}. Ignore`)
      }
    }
    
    media.hash = createHash(serialize(media, 'hash'))
    cb(null, media)
  })  

  return stream
}

export const createDatabaseMapperStream = (plugins: TPluginContext[], config: TGalleryConfig, updated: string) => {
  const entries = [] as TDatabaseMapperEntry[]

  const disabledMappers = config.pluginManager?.disabledMappers || []
  for (let plugin of plugins) {
    if (!plugin.factory?.getDatabaseMappers) {
      continue
    }

    const databaseEntries = getDatabaseMapper(plugin.plugin, plugin.factory, disabledMappers)
    entries.push(...databaseEntries)
  }

  if (!entries.length) {
    throw new Error(`No database mapper found. At least one is required`)
  }

  const stream = createStream(entries, config, updated)

  return {
    stream,
    entries: entries
  }
}
