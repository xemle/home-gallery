import { TPluginManager, TPlugin, TPluginExtension } from './plugin'

export type TGalleryPluginManager = TPluginManager & {
  addPlugin(plugin: TPlugin)
  loadPlugins(): Promise<void>
  getPlugins(): TPlugin[]
  getExtensions(): TPluginExtension[]
}
