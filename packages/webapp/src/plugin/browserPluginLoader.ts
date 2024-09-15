import { TPlugin } from "@home-gallery/types"
import Logger from "@home-gallery/logger"
import { PluginSchema } from '@home-gallery/plugin'

export type TPluginContext = {
  plugin: TPlugin
  entry?: string
  initialized: boolean
}

export class BrowserPluginLoader {
  plugins: TPluginContext[] = []
  log = Logger('pluginLoader')
  pluginEntries: string[]

  constructor(pluginEntries: string[]) {
    this.pluginEntries = pluginEntries
  }

  addPlugin(plugin: TPlugin, entry?: string) {
    return PluginSchema.validate(plugin)
      .then(() => {
        this.plugins.push({
          plugin,
          entry,
          initialized: false
        })
        return plugin
      })
      .catch(err => {
        this.log.warn(err, `Failed to load plugin ${plugin?.name}: ${err}`)
      })
  }

  async loadPlugins() {
    for (const entry of this.pluginEntries) {
      await import(entry)
        .then(pluginModule => {
          return this.addPlugin(pluginModule.default, entry)
        })
        .then(plugin => {
          this.log.debug(`Added remote plugin ${plugin.name} from ${entry}`)
        })
        .catch(err => {
          this.log.warn(err, `Failed to load plugin from entry ${entry}: ${err}. Skip it`)
        })
    }
  }
}