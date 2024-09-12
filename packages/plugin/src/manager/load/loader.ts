import fs from 'fs/promises'
import path from 'path';
import url from 'url'

import { TGalleryConfig, TLogger, TPlugin } from "@home-gallery/types";
import { Logger } from "@home-gallery/logger";

import { TPluginContext } from "../types.js";
import { PluginSchema } from '../pluginSchemas.js';
import { resolvePackageEntry } from './pkg.js';
import { resolveValid } from './resolve.js';

export class PluginLoader {
  plugins: TPluginContext[] = []
  log: TLogger = Logger('pluginLoader')
  config: TGalleryConfig

  constructor(config: TGalleryConfig) {
    this.config = config
  }

  async importPlugin(file: string) {
    // On Windows, absolute paths must be valid file:// URLs
    const fileUrl = url.pathToFileURL(file).href
    const module = await import(fileUrl)
    const plugin = module.default ?? module
    await PluginSchema.validate(plugin)
      .catch((err: any) => {
        throw new Error(`Invalid plugin file ${file}: ${err}. Skip it`, {cause: err})
      })

    return this.addPlugin(file, plugin)
  }

  async addPlugin(file: string, plugin: any) {
    const { name } = plugin

    const nameExists = this.plugins.find(ctx => ctx.plugin.name == name)
    if (nameExists) {
      throw new Error(`Duplicate plugin name ${plugin.name}`)
    }
    if (this.config.pluginManager?.disabled?.includes(name)) {
      this.log.debug(`Skip loading disabled plugin ${plugin.name}`)
      return
    }

    this.plugins.push({
      file,
      plugin,
      initialized: false
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
      if (!stat.isDirectory() && (!stat.isFile() || !pluginFile.match(/\.[mc]?js$/))) {
        continue
      }
      await this.loadPlugin(pluginFile)
        .then(plugin => plugin && dirPlugins.push(plugin))
        .catch(err => this.log.warn(err, `Failed to load plugin from ${pluginFile}`))
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