import { Schema } from 'yup'

import Logger from "@home-gallery/logger";
import { TPlugin, TExtenstionType, TPluginExtension, TExtensionBase } from "@home-gallery/types";

export type TExtentionEntry = {
  plugin: TPlugin
  type: TExtenstionType
  extension: any
}

type TExtensionRegistrySchemas = {[key: string]: Schema}

export class ExtensionRegistry {

  extensionsEntries: TPluginExtension[] = []

  schemas: TExtensionRegistrySchemas
  disabledExtensions: string[]
  log = Logger('extensionRegistry')

  constructor(schemas: TExtensionRegistrySchemas = {}, disabledExtensions: string[] = []) {
    this.schemas = schemas
    this.disabledExtensions = disabledExtensions
  }

  async register(plugin: TPlugin, type: TExtenstionType, extension: TExtensionBase & any) {
    if (this.disabledExtensions.includes(`${plugin.name}.${extension.name}`)) {
      this.log.info(`Plugin extension ${plugin.name}.${extension.name} is disabled. Skip extension registration`)
      return
    }

    const schema = this.schemas[type] as Schema
    if (!schema) {
      throw new Error(`Registration error for plugin ${plugin.name}: Unsupported extension type: ${type}`)
    }
    await schema.validate(extension)
      .catch((err: any) => {
        throw new Error(`Registration error for plugin ${plugin.name}: ${err}`, {cause: err})
      })

    this.extensionsEntries.push({
      plugin,
      type,
      extension
    })
  }

  async registerLegacyFactory(plugin: TPlugin, factory: any) {
    if (typeof factory?.getExtractors == 'function') {
      const extractorPlugins = factory.getExtractors()
      for (const extension of extractorPlugins) {
        await this.register(plugin, 'extractor', extension)
      }
    }
    if (typeof factory?.getDatabaseMappers == 'function') {
      const databasePlugins = factory.getDatabaseMappers()
      for (const extension of databasePlugins) {
        await this.register(plugin, 'database', extension)
      }
    }
    if (typeof factory?.getQueryPlugins == 'function') {
      const queryPlugins = factory.getQueryPlugins()
      for (const extension of queryPlugins) {
        await this.register(plugin, 'query', extension)
      }
    }
  }

  getSupportedExtensionTypes() {
    return Object.keys(this.schemas)
  }

  getExtensions() {
    return this.extensionsEntries
  }
}