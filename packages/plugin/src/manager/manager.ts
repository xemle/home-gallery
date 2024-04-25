import fs from 'fs/promises'
import path from 'path'

import Logger from '@home-gallery/logger'
import { TModuleFactory, TPlugin, TGalleryPluginManager, TLogger, TExtractorStream, TStorage, TGalleryConfig, TExtractorStreamTearDown, TDatabaseMapperStream, TDatabaseMapperEntry, TStorageEntry } from '@home-gallery/types'

import { TPluginContext } from './types.js'
import { resolveValid } from './load/resolve.js'
import { resolvePackageEntry } from './load/pkg.js'
import { ExtractorStreamFactory } from './extractorStreamFactory.js'
import { createDatabaseMapperStream } from './databaseMapperStreamFactory.js'

export class PluginManager implements TGalleryPluginManager {
  plugins: TPluginContext[] = []
  config: TGalleryConfig
  managerConfig: any
  log: TLogger

  constructor(config: TGalleryConfig = {}) {
    this.config = config
    this.managerConfig = config.pluginManager || {}
    this.log = Logger('pluginManager')
  }

  /**
   * Currently the PluginManager is experimental and interfaces
   * are subjects of change until ApiVersion 1.0 is released
   */
  getApiVersion(): string {
    return '0.6'
  }

  getConfig(): TGalleryConfig {
    return this.config
  }

  createLogger(module: string): TLogger {
    return Logger(module)
  }

  async importPlugin(file: string) {
    const module = await import(file)
    const plugin = module.default ?? module
    this.validatePluginProps(file, plugin)
    return this.addPlugin(file, plugin)
  }

  validatePluginProps(file: string, plugin: any) {
    if (typeof plugin != 'object') {
      throw new Error(`Invalid plugin ${file}: No object was exported`)
    }

    const requiredProps = [
      {name: 'name', type: 'string'},
      {name: 'version', type: 'string'},
      {name: 'initialize', type: 'function'},
    ]

    const missingProps = requiredProps.map(p => p.name).filter(name => typeof plugin[name] == 'undefined')
    if (missingProps.length) {
      throw new Error(`Invalid plugin ${file}: Missing properties ${missingProps.join(',')}`)
    }

    const invalidProps = requiredProps.filter(prop => typeof plugin[prop.name] != prop.type)
    if (invalidProps.length) {
      throw new Error(`Invalid plugin ${file}: Incompatible property types: ${invalidProps.map(p => `${p.name} should be a ${p.type}`).join(' and ')}`)
    }
  }

  async addPlugin(file: string, plugin: any) {
    const { name } = plugin

    const nameExists = this.plugins.find(ctx => ctx.plugin.name == name)
    if (nameExists) {
      throw new Error(`Duplicate plugin name ${plugin.name}`)
    }
    if (this.managerConfig.disabled?.includes(name)) {
      this.log.debug(`Skip loading disabled plugin ${plugin.name}`)
      return
    }

    this.plugins.push({
      file,
      plugin,
      loaded: false
    })
    return plugin
  }

  async getPackageEntry(dir: string) {
    const data = await fs.readFile(path.join(dir, 'package.json'), 'utf-8')
    let pkg
    try {
      pkg = JSON.parse(data)
    } catch (err) {
      throw new Error(`Invalid package.json format: ${err}`)
    }

    const main = resolvePackageEntry(pkg)
    if (main) {
      return path.resolve(dir, main)
    }

    const files = await fs.readdir(dir)
    const index = ['index.js', 'index.mjs', 'index.cjs'].find(index => files.includes(index))
    if (index) {
      return path.resolve(dir, index)
    }

    throw new Error(`Could not resolve package entry for ${path.join(dir, 'package.json')}`)
  }

  async loadPlugin(dirOrFile: string) {
    const stat = await fs.stat(dirOrFile)

    if (stat.isFile() && dirOrFile.match(/\.[mc]?js$/)) {
      return this.importPlugin(path.resolve(dirOrFile))
    } else if (stat.isDirectory()) {
      const files = await fs.readdir(dirOrFile)
      if (files.includes('package.json')) {
        const packageEntry = await this.getPackageEntry(dirOrFile)
        return this.importPlugin(packageEntry)
      }
      const indexFile = ['index.js', 'index.mjs', 'index.cjs'].find(index => files.includes(index))
      if (!indexFile) {
        throw new Error(`Could not find index file in plugin directory ${dirOrFile}`)
      }
      return this.importPlugin(path.resolve(dirOrFile, indexFile))
    } else {
      throw new Error(`Invalid plugin location ${dirOrFile}`)
    }
  }

  async loadPluginDir(dir: string) {
    const t0 = new Date()
    const dirPlugins: TPlugin[] = []

    const pluginDir = path.resolve(dir)
    const exists = await fs.access(dir).then(() => true, () => false)
    if (!exists) {
      this.log.warn(`Plugin dir ${pluginDir} does not exists. Skip it`)
      return
    }

    const files = await fs.readdir(dir)
    for (let file of files) {
      const pluginFile = path.resolve(dir, file)
      const stat = await fs.stat(pluginFile)
      if (!stat.isDirectory() && (!stat.isFile() || !pluginFile.match(/\.[mc]?js$/))) {
        continue
      }
      await this.loadPlugin(pluginFile)
        .then(plugin => plugin && dirPlugins.push(plugin))
        .catch(err => this.log.warn(err, `Failed to load plugin from ${pluginFile}`))
    }

    if (!dirPlugins.length) {
      this.log.info(t0, `No plugins found in directory ${dir}`)
    } else {
      this.log.debug(t0, `Loaded ${dirPlugins.length} plugins from directory ${dir}: ${dirPlugins.map(p => p.name).join(', ')}`)
    }
  }

  private validateFactory(factory: any) {
    if (typeof factory != 'object') {
      throw new Error(`Invalid factory`)
    }

    const fns = [
      'getExtractors',
      'getDatabaseMappers'
    ]

    const foundFn = fns.filter(fn => typeof factory[fn] != 'undefined')
    if (!foundFn.length) {
      throw new Error(`No module factory method found. At least on is required of: ${fns.join(', ')}`)
    }

    for (const fn of foundFn) {
      if (typeof factory[fn] != 'function') {
        throw new Error(`Invalid module factory method ${fn}. ${fn} is not a function`)
      }
    }
    return factory
  }

  async initializePlugins() {
    const orderedPlugins = resolveValid(this.plugins)
    for (let ctx of orderedPlugins) {
      await ctx.plugin.initialize(this)
        .then(this.validateFactory)
        .then((factory: TModuleFactory) => {
          ctx.factory = factory
          ctx.loaded = true
        })
        .catch((err: any) => {
          this.log.error(err, `Failed to initialize plugin ${ctx.plugin.name} (from ${ctx.file}): ${err}`)
        })
    }
  }

  getPlugin(name: string) {
    const ctx = this.plugins.find(ctx => ctx.loaded && ctx.plugin.name == name)
    if (ctx) {
      return ctx.plugin
    }
  }

  getPlugins(): TPlugin[] {
    return this.plugins
      .filter(ctx => ctx.loaded && ctx.factory)
      .map(ctx => ctx.plugin)
  }

  getModuleFactoryFor(name: string) {
    return this.plugins.find(p => p.plugin.name == name && p.loaded)?.factory
  }

  async getExtractorStreams(storage: TStorage): Promise<[TExtractorStream[], TExtractorStreamTearDown]> {
    const loadedPlugins = this.plugins.filter(ctx => ctx.loaded && ctx.factory)


    const streamFactory = new ExtractorStreamFactory(this, storage, loadedPlugins)
    return streamFactory.getExtractorStreams()
  }

  async getDatabaseMapperStream(updated: string): Promise<TDatabaseMapperStream> {
    const loadedPlugins = this.plugins.filter(ctx => ctx.loaded && ctx.factory)

    return createDatabaseMapperStream(loadedPlugins, this.getConfig(), updated)
  }

}