import { TPluginManager } from "./plugin.js"
import { TQueryContext, TQueryPlugin } from "./query.js"

export type TBrowserPlugin = {
  name: string
  version: string
  requires?: string[]
  initialize: (manager: TPluginManager) => Promise<TBrowserModuleFactory>
}

export type TBrowserModuleFactory = {
  getQueryPlugins?: () => Promise<TQueryPlugin[]>
}

export type TBrowserPluginManager = TPluginManager & {
  loadPlugins(): Promise<void>
  executeQuery(entries: any, query: string, context: TQueryContext): Promise<any>
}