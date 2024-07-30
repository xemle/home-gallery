import { Transform } from 'stream'

import { TStorage } from './storage'
import { TExtractorPhase, TExtractorFunction, TExtractorTask } from './extractor'
import { TDatabaseMapper } from './database'
import { TLogger } from './logger'
import { TGalleryConfig } from './config'

export type TPlugin = {
  name: string
  version: string
  requires?: string[]
  initialize: (manager: TPluginManager) => Promise<TModuleFactory>
}

export type TPluginManager = {
  getApiVersion(): string
  getConfig(): TGalleryConfig
  createLogger(module: string): TLogger
}

export type TModuleFactory = {
  getExtractors?: () => TExtractor[]
  getDatabaseMappers?: () => TDatabaseMapper[]
}

export type TExtractorContext = {
  storage: TStorage
  manager: TPluginManager
  [key: string]: any
}

export type TExtractor = {
  name: string
  phase: TExtractorPhase
  create: (context: TExtractorContext, config: TGalleryConfig) => Promise<TExtractorFunction | TExtractorTask | Transform>
  /**
   * Called when all extractor task have been completed
   */
  tearDown?: (context: TExtractorContext) => Promise<void>
}
