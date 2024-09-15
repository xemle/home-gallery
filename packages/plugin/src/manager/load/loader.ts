import fs from 'fs/promises'
import path from 'path';
import url from 'url'

import { TGalleryConfig, TLogger, TPlugin } from "@home-gallery/types";
import { Logger } from "@home-gallery/logger";

import { TPluginContext } from "../types.js";
import { PluginSchema } from '../pluginSchemas.js';
import { resolveBrowserEntry, resolvePackageEntry } from './pkg.js';
import { resolveValid } from './resolve.js';

type TPluginOption = {
  file?: string
  publicDir?: string
  browserOnly?: boolean
}

export class PluginLoader {
  plugins: TPluginContext[] = []
  log: TLogger = Logger('pluginLoader')
  config: TGalleryConfig

  constructor(config: TGalleryConfig) {
    this.config = config
  }

  async importPlugin(file: string, options: TPluginOption = {}) {
    // On Windows, absolute paths must be valid file:// URLs
    const fileUrl = url.pathToFileURL(file).href
    const module = await import(fileUrl)
    const plugin = module.default ?? module
    await PluginSchema.validate(plugin)
      .catch((err: any) => {
        throw new Error(`Invalid plugin file ${file}: ${err}. Skip it`, {cause: err})
      })

    return this.addPlugin(plugin, {...options, file})
  }

  async addPlugin(plugin: any, options: TPluginOption = {}) {
    const { name } = plugin

    const nameExists = this.plugins.find(ctx => ctx.plugin.name == name)
    if (nameExists) {
      throw new Error(`Duplicate plugin name ${plugin.name}`)
    }
    if (this.config.pluginManager?.disabled?.includes(name)) {
      this.log.debug(`Skip loading disabled plugin ${plugin.name}`)
      return
    }
    if (options.browserOnly && !plugin.environments) {
      plugin.environments = ['browser']
    }

    this.plugins.push({
      plugin,
      file: options.file || null,
      publicDir: options.publicDir || null,
      initialized: false
    })
    return plugin
  }

  async readPackageJson(file: string) {
    const data = await fs.readFile(file, 'utf-8')
    try {
      return JSON.parse(data)
    } catch (err) {
      throw new Error(`Invalid format for ${file}: ${err}`)
    }
  }

  async getPackageEntry(pkg: any, dir: string) {
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

  async #loadBrowserEntry(pkg: any, dir: string) {
    const browserEntry = resolveBrowserEntry(pkg)
    if (!browserEntry) {
      return
    }
    const browserEntryFile = path.resolve(dir, browserEntry)
    return this.importPlugin(browserEntryFile, {publicDir: path.dirname(browserEntryFile), browserOnly: true})
  }

  async loadPlugin(dirOrFile: string, baseDir: string | null = null) {
    const stat = await fs.stat(dirOrFile)

    if (stat.isFile() && dirOrFile.match(/\.[mc]?js$/)) {
      return this.importPlugin(path.resolve(dirOrFile), baseDir ? {publicDir: path.dirname(dirOrFile)} : {})
    } else if (stat.isDirectory()) {
      const files = await fs.readdir(dirOrFile)
      if (files.includes('package.json')) {
        const pkg = await this.readPackageJson(path.resolve(dirOrFile, 'package.json'))
        await this.#loadBrowserEntry(pkg, dirOrFile)
        const packageEntry = await this.getPackageEntry(pkg, dirOrFile)
        return this.importPlugin(packageEntry, {publicDir: path.dirname(packageEntry)})
      }
      const indexFile = ['index.js', 'index.mjs', 'index.cjs'].find(index => files.includes(index))
      if (!indexFile) {
        throw new Error(`Could not find index file in plugin directory ${dirOrFile}`)
      }
      return this.importPlugin(path.resolve(dirOrFile, indexFile), !indexFile.endsWith('.cjs') ? {publicDir: dirOrFile} : {})
    } else {
      throw new Error(`Invalid plugin location ${dirOrFile}`)
    }
  }

  async loadPluginDir(fileOrDir: string) {
    const t0 = new Date()
    const dirPlugins: TPlugin[] = []

    const pluginDir = path.resolve(fileOrDir)
    const exists = await fs.access(fileOrDir).then(() => true, () => false)
    if (!exists) {
      this.log.warn(`Plugin dir ${pluginDir} does not exists. Skip it`)
      return
    }

    const stat = await fs.stat(fileOrDir)
    if (stat.isFile()) {
      return this.loadPlugin(fileOrDir)
    } else if (!stat.isDirectory()) {
      throw new Error(`Plugin file ${fileOrDir} is not a file or a directory`)
    }

    const files = await fs.readdir(fileOrDir)
    for (let file of files) {
      const pluginFile = path.resolve(fileOrDir, file)
      const stat = await fs.stat(pluginFile)
      if (!stat.isDirectory() && !stat.isFile()) {
        continue
      }

      await this.loadPlugin(pluginFile, fileOrDir)
        .then(plugin => plugin && dirPlugins.push(plugin))
        .catch(err => this.log.warn(err, `Failed to load plugin from ${pluginFile}: ${err}`))
    }

    if (!dirPlugins.length) {
      this.log.info(t0, `No plugins found in directory ${fileOrDir}`)
    } else {
      this.log.debug(t0, `Loaded ${dirPlugins.length} plugins from directory ${fileOrDir}: ${dirPlugins.map(p => p.name).join(', ')}`)
    }
  }

  getResolvedPlugins() {
    return resolveValid(this.plugins)
  }

}