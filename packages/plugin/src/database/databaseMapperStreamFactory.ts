import Logger from "@home-gallery/logger";
import { TDatabaseMapper, TDatabaseMapperEntry, TStorageEntry, TGalleryConfig, TPluginExtension } from "@home-gallery/types";
import { through } from "@home-gallery/stream";
import { serialize, createHash } from '@home-gallery/common';

const log = Logger('plugin.databaseMapperFactory')

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

export const createDatabaseMapperStream = (extensions: TPluginExtension[], config: TGalleryConfig, updated: string) => {
  const entries = [] as TDatabaseMapperEntry[]

  const disabledExtensions = config.pluginManager?.disabled || []
  for (let extension of extensions) {
    if (extension.type != 'database') {
      continue
    }
    const databaseMapper = extension.extension as TDatabaseMapper
    const name = `${extension.plugin.name}.${extension.type}.${databaseMapper.name}`
    if (disabledExtensions.includes(extension.plugin.name) || disabledExtensions.includes(name)) {
      log.debug(`Database mapper ${databaseMapper.name} from plugin ${extension.plugin.name} is disabled`)
      continue
    }

    entries.push({
      plugin: extension.plugin,
      databaseMapper
    })
  }

  if (!entries.length) {
    throw new Error(`No database mapper found. At least one is required`)
  }

  entries.sort((a, b) => {
    const aOrder = a.databaseMapper.order || 1
    const bOrder = b.databaseMapper.order || 1
    return aOrder <= bOrder ? -1 : 1
  })

  const stream = createStream(entries, config, updated)

  return {
    stream,
    entries: entries
  }
}
