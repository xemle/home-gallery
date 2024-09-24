import Logger from '@home-gallery/logger'

import { TPluginContext } from '../types.js'
import { SemVer } from './semver.js'

const log = Logger('plugin.resolve')

type TNameMap = {
  [name: string]: TPluginContext
}

function mapName(plugins: TPluginContext[]) {
  return plugins.reduce((result: TNameMap, ctx: TPluginContext) => {
    result[ctx.plugin.name] = ctx
    return result
  }, {})
}

function swap(names: string[], from: number, to: number) {
  const tmp = names[to]
  names[to] = names[from]
  names[from] = tmp
}

function findMissingDep(deps: string[], names: string[], name2plugin: TNameMap) {
  return deps.find(nameValue => {
    const [name, requiredVersion] = nameValue.split('@')
    if (!names.includes(name)) {
      return nameValue
    }
    if (requiredVersion) {
      const pluginVersion = name2plugin[name].plugin.version
      const pluginSemVer = new SemVer(pluginVersion)
      return !pluginSemVer.matches(new SemVer(requiredVersion))
    }
    return false
  })
}

export function resolve(plugins: TPluginContext[]) {
  const name2plugin = mapName(plugins)
  const names = plugins.map(ctx => ctx.plugin.name)

  const orderedNames: string[] = []
  let pos = 0
  let swappedPos = 1
  while (pos < names.length) {
    const name = names[pos]
    const deps: string[] = name2plugin[name].plugin.requires || []

    const missingDep = findMissingDep(deps, orderedNames, name2plugin)
    if (!missingDep) {
      orderedNames.push(name)
      pos++
      swappedPos = pos + 1
      continue
    }
    if (swappedPos == names.length) {
      const err = new Error(`Could not resolve dependency of ${name}. Missing required dependency ${missingDep}`)
      Object.assign(err, {
        name,
        missingDep
      })
      throw err
    }

    swap(names, pos, swappedPos++)
  }

  const orderedPlugins = orderedNames.map(name => name2plugin[name])
  return orderedPlugins
}

export const resolveValid = (plugins: TPluginContext[]): TPluginContext[] => {
  try {
    return resolve(plugins)
  } catch (err: any) {
    if (!err.name) {
      throw err
    }

    log.warn(`Failed to resolve plugin dependency. Plugin ${err.name} requires missing dependency ${err.missingDep}. Skip plugin`)

    const excludeFailing = plugins.filter(plugin => plugin.plugin.name != err.name)
    return resolveValid(excludeFailing)
  }
}