import { TPluginManager, TPlugin, TPluginExtension } from './plugin'

export type TGalleryPluginManager = TPluginManager & {
  addPlugin(plugin: TPlugin)
  loadPlugins(): Promise<void>
  getPlugins(): TPlugin[]
  getExtensions(): TPluginExtension[]
}

export type TBrowserPluginResource = {
  plugin: TPlugin
  localDir: string
  publicPath: string
  publicEntry: string
}

export type TBrowserPluginContext = {
  plugins: TBrowserPluginResource[]
}

export type TServerPluginManager = TGalleryPluginManager & {
  getBrowserPlugins(): TBrowserPluginContext
}