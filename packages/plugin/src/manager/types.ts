import { TPlugin, TModuleFactory } from '@home-gallery/types'

export type TPluginContext = {
  file: string
  plugin: TPlugin
  loaded: boolean
  factory?: TModuleFactory
}