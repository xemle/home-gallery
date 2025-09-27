import { TPluginManager } from "./plugin.js"
import { TQueryContext } from "./query.js"

export type TBrowserPlugin = {
  name: string
  version: string
  requires?: string[]
  initialize: (manager: TPluginManager) => Promise<void>
}

export type TBrowserPluginManager = TPluginManager & {
  loadPlugins(): Promise<void>
  executeQuery(entries: any, query: string, context: TQueryContext): Promise<any>
}