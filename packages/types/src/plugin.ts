import { TLogger } from './logger'
import { TGalleryConfig } from './config'

export type TPlugin = {
  name: string
  version: string
  requires?: string[]
  initialize: (manager: TPluginManager) => Promise<void>
}

export type TExtenstionType = 'extractor' | 'database' | 'query'

export type TExtensionBase = {
  name: string
}

export type TPluginExtension = {
  plugin: TPlugin,
  type: TExtenstionType
  extension: TExtensionBase & any
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
  register(type: TExtenstionType, extension: TExtensionBase & any): Promise<void>
}
