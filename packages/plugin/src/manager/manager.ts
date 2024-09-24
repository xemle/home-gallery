import path from 'path'

import Logger from '@home-gallery/logger'
import { TPlugin, TServerPluginManager, TLogger, TGalleryConfig, TExtenstionType, TPluginExtension, TBrowserPluginContext } from '@home-gallery/types'

import { ExtensionRegistry } from './extensionRegistry.js'
import { DatabaseSchema, ExtractorSchema, QuerySchema } from './pluginSchemas.js'
import { PluginLoader } from './load/loader.js'
import { proxyRegisterForPlugin } from './pluginRegistryProxy.js'
import { toCamelName } from '../utils/nameConverter.js'

export class PluginManager implements TServerPluginManager {
  log: TLogger = Logger('pluginManager')

  config: TGalleryConfig
  context: any

  loader: PluginLoader
  registry: ExtensionRegistry

  constructor(config: TGalleryConfig = {}, context = {}) {
    this.config = config
    this.context = context

    this.loader = new PluginLoader(config)
    this.registry = new ExtensionRegistry({
      'extractor': ExtractorSchema,
      'database': DatabaseSchema,
      'query': QuerySchema,
    }, config.pluginManager?.disabled || [])
  }

  /**
   * Currently the PluginManager is experimental and interfaces
   * are subjects of change until ApiVersion 1.0 is released
   */
  getApiVersion(): string {
    // 0.9 - Add getBrowserPlugins
    // 0.8 - Add register. Deprecate ModuleFactory
    // 0.7 - Add TPluginManager context, chanage TExtractor create() signature
    // 0.6 - Initial
    return '0.9'
  }

  getConfig(): TGalleryConfig {
    return this.config
  }

  createLogger(module: string): TLogger {
    return Logger(module)
  }

  getContext() {
    return this.context
  }

  addPlugin(plugin: TPlugin) {
    return this.loader.addPlugin(plugin)
  }

  async #initializePlugins() {
    const orderedPlugins = this.loader.getResolvedPlugins()
    for (let ctx of orderedPlugins) {
      if (ctx.plugin.environments && !ctx.plugin.environments.includes('server')) {
        this.log.trace(`Skip initializing non-server plugin: ${ctx.plugin.name}`)
        continue
      }
      const managerProxy = proxyRegisterForPlugin(this, this.registry, ctx.plugin)
      await ctx.plugin.initialize(managerProxy)
        .then((factory: unknown) => {
          if (typeof factory == 'object') {
            return this.registry.registerLegacyFactory(ctx.plugin, factory)
          }
        })
        .then(() => {
          ctx.initialized = true
        })
        .catch((err: any) => {
          this.log.error(err, `Failed to initialize plugin ${ctx.plugin.name} (from ${ctx.file}): ${err}`)
        })
    }
  }

  async loadPlugins() {
    const files = this.config.pluginManager?.plugins || []
    for (let file of files) {
      await this.loader.loadPlugin(file)
        .catch(err => {
          this.log.warn(err, `Failed to load plugin from file ${file}: ${err}`)
        })
    }

    const dirs = this.config.pluginManager?.dirs || []
    for (let dir of dirs) {
      await this.loader.loadPluginDir(dir)
        .catch(err => {
          this.log.warn(err, `Failed to load plugins from dir ${dir}: ${err}`)
        })
    }

    await this.#initializePlugins()
  }

  async register(type: TExtenstionType, extension: any) {
    throw new Error('Illigal method call')
  }

  getExtensions(): TPluginExtension[] {
    return this.registry.getExtensions()
  }

  getPlugins(): TPlugin[] {
    const result: TPlugin[] = []
    for (let extension of this.getExtensions()) {
      if (!result.includes(extension.plugin)) {
        result.push(extension.plugin)
      }
    }

    return result
  }

  getBrowserPlugins() {
    const orderedPlugins = this.loader.getResolvedPlugins()
    const browserContext: TBrowserPluginContext = {
      plugins: [],
    }

    for (let ctx of orderedPlugins) {
      if (!ctx.plugin.environments?.includes('browser')) {
        continue
      } else if (!ctx.publicDir) {
        this.log.warn(`Skip browser plugin ${ctx.plugin.name}. Public directory is missing`)
        continue
      }
      if (ctx.file && ctx.publicDir) {
        const publicPath = toCamelName(ctx.plugin.name) + '/'
        const publicEntry = path.posix.join(publicPath, path.relative(ctx.publicDir, ctx.file).replaceAll(path.win32.sep, path.posix.sep))
        browserContext.plugins.push({plugin: ctx.plugin, localDir: ctx.publicDir, publicPath, publicEntry})
      }
    }

    browserContext.plugins.sort((a, b) => a.publicPath.localeCompare(b.publicPath))

    return browserContext
  }

}
