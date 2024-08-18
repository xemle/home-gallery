import { TPlugin } from '@home-gallery/types'

export type TPluginContext = {
  file: string
  plugin: TPlugin
  initialized: boolean
}