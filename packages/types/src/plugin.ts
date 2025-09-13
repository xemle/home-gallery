import { TLogger } from './logger.js'
import { TGalleryConfig } from './config.js'

export type TPlugin = {
  name: string
  version: string
  requires?: string[]
  environments?: TPluginEnvironment[]
  initialize: (manager: TPluginManager) => Promise<void>
}

export type TPluginEnvironment = 'server' | 'browser'

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
  type: 'extractorContext' | 'databaseMapperContext' | 'serverContext' | 'cliContext' | 'browserContext'
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
