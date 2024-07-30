import { Transform } from 'stream'

import { TStorage } from './storage'
import { TDatabaseMapper } from './database'
import { TPluginManager, TPlugin, TExtractor, TModuleFactory } from './plugin'
import { TQueryContext } from './query'

export type TGalleryPluginManager = TPluginManager & {
  loadPlugin(file: string): Promise<void>
  loadPluginDir(dir: string): Promise<void>
  initializePlugins(): Promise<void>
  getPlugin(name: string): TPlugin | undefined
  getPlugins(): TPlugin[]
  getModuleFactoryFor(name: string): TModuleFactory | undefined
  getExtractorStreams(storage: TStorage): Promise<[TExtractorStream[], TExtractorStreamTearDown]>
  getDatabaseMapperStream(updated: string): Promise<TDatabaseMapperStream>
  executeQuery(entries: any, query: string, context: TQueryContext): Promise<any>
}

export type TExtractorStream = {
  stream: Transform
  extractor: TExtractor;
  plugin: TPlugin;
}

export type TExtractorStreamTearDown = () => Promise<void>

export type TDatabaseMapperStream = {
  stream: Transform,
  entries: TDatabaseMapperEntry[]
}

export type TDatabaseMapperEntry = {
  databaseMapper: TDatabaseMapper;
  plugin: TPlugin;
}
