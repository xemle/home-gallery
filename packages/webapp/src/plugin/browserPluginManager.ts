import Logger from '@home-gallery/logger'
import { TGalleryConfig, TGalleryContext, TLogger, TPlugin, TGalleryPluginManager, TQueryContext, TPluginExtension, TQueryPlugin, TExtenstionType } from "@home-gallery/types";
import { QueryExecutor, ExtensionRegistry, QuerySchema, PluginSchema, proxyRegisterForPlugin } from '@home-gallery/plugin'

type TPluginContext = {
  plugin: TPlugin
  initialized: boolean
}

export class BrowserPluginManager implements TGalleryPluginManager {
  plugins: TPluginContext[] = []

  config: TGalleryConfig
  context: TGalleryContext

  registry: ExtensionRegistry

  queryExecutor: QueryExecutor
  log: TLogger

  constructor(config: TGalleryConfig, context: TGalleryContext) {
    this.config = config;
    this.context = context;

    this.registry = new ExtensionRegistry({
      'query': QuerySchema,
    }, [])
    this.queryExecutor = new QueryExecutor()
    this.log = Logger('pluginManager')
  }

  getApiVersion(): string {
    // replace moduleFactory by register
    return '0.8'
  }

  getConfig(): TGalleryConfig {
    return this.config;
  }

  createLogger(module: string): TLogger {
    return Logger(module)
  }

  getContext(): TGalleryContext {
    return this.context
  }

  addPlugin(plugin: TPlugin) {
    PluginSchema.validate(plugin)
      .then(() => {
        this.plugins.push({
          plugin,
          initialized: false
        })
      })
      .catch(err => {
        this.log.warn(err, `Failed to load plugin ${plugin?.name}: ${err}`)
      })
  }

  async loadPlugins() {
    for (const plugin of this.plugins) {
      if (plugin.initialized) {
        continue
      }
      const proxyManager = proxyRegisterForPlugin(this, this.registry, plugin.plugin)
      await plugin.plugin.initialize(proxyManager)
        .then(() => {
          plugin.initialized = true
        })
        .catch(err => {
          this.log.warn(err, `Failed to initialize plugin ${plugin.plugin?.name}: ${err}`)
        })
    }
    this.queryExecutor = new QueryExecutor()
    const queryPlugins = this.getExtensions().filter(e => e.type == 'query').map(e => e.extension) as TQueryPlugin[]
    this.queryExecutor.addQueryPlugins(queryPlugins)
  }

  async register(type: TExtenstionType, extension: any) {
    // will by proxied to registry
  }

  getPlugins(): TPlugin[] {
    return this.plugins.filter(p => p.initialized).map(p => p.plugin)
  }

  getExtensions(): TPluginExtension[] {
    return this.registry.getExtensions()
  }

  async executeQuery(entries: any[], query: string, queryContext: TQueryContext) {
    return this.queryExecutor.execute(entries, query, queryContext)
  }

}