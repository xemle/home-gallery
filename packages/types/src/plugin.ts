import { Transform } from 'stream'

import { TStorage } from './storage'
import { TExtractorPhase, TExtractorFunction, TExtractorTask } from './extractor'
import { TDatabaseMapper } from './database'
import { TQueryPlugin } from './query'
import { TLogger } from './logger'
import { TGalleryConfig } from './config'

export type TPlugin = {
  name: string
  version: string
  requires?: string[]
  initialize: (manager: TPluginManager) => Promise<TModuleFactory>
}

/**
 * Context to store and read global objects
 */
export type TGalleryContext = {
  type: 'extractorContext' | 'databaseMapperContext' | 'serverContext' | 'cliContext'
  plugin: {
    [key: string]: any
  }
  [key: string]: any
}

export type TPluginManager = {
  getApiVersion(): string
  getConfig(): TGalleryConfig
  createLogger(module: string): TLogger
  getContext(): TGalleryContext
}

export type TModuleFactory = {
  getExtractors?: () => TExtractor[]
  getDatabaseMappers?: () => TDatabaseMapper[]
  getQueryPlugins?: () => TQueryPlugin[]
}

export type TExtractor = {
  name: string
  phase: TExtractorPhase
  create: (storage: TStorage) => Promise<TExtractorFunction | TExtractorTask | Transform>
  /**
   * Called when all extractor task have been completed
   */
  tearDown?: () => Promise<void>
}
