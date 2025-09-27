import { Transform } from 'stream'

import { TGalleryConfig } from './config.js'
import { TStorageEntry } from './storage.js'
import { TPlugin } from './plugin.js'

export type TDatabaseEntry = {
  id: string,
  hash: string,
  type: string,
  updated: string,
  plugin: Record<string, any>,
  [key: string]: any
}

/**
 * Map a storage entry from the extractor step to a
 * database entry.
 *
 * If the mapper returns an object, this will be used. Otherwise
 * the media argument is used
 */
export type TDabaseMapperFunction = (entry: TStorageEntry, media: TDatabaseEntry, config: TGalleryConfig) => any

export type TDatabaseMapper = {
  name: string
  /**
   * Default order is 1
   */
  order?: number
  mapEntry: TDabaseMapperFunction
}

export type TDatabaseMapperStream = {
  stream: Transform,
  entries: TDatabaseMapperEntry[]
}

export type TDatabaseMapperEntry = {
  databaseMapper: TDatabaseMapper;
  plugin: TPlugin;
}
