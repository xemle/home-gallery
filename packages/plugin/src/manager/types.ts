import { TPlugin } from '@home-gallery/types'

export type TPluginContext = {
  plugin: TPlugin
  /**
   * Plugin file. Null if plugin was added by source
   */
  file: string | null
  /**
   * Public plugin Dir. Null if plugin is a single file
   */
  publicDir: string | null
  initialized: boolean
}