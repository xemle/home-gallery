import { TGalleryConfig } from './config'
import { TStorageEntry } from './storage'

export type TDatabaseEntry = {
  id: string,
  hash: string,
  type: string,
  updated: string,
  plugin: {},
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
