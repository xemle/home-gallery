import os from 'os'
import fs from 'fs/promises'
import yaml from 'yaml'

import { isString, isArray, toList, isObject } from './utils'

export interface Target {
  platform: string,
  arch: string,
  command: string[] | boolean
}

export interface PlatformArch {
  platform?: string | string[]
  arch?: string | string[]
  platformArch?: string | string[]
}

export interface RunStep extends PlatformArch {
  command: string[]
}

export interface Package extends PlatformArch {
  name: string
}

export interface Pattern extends PlatformArch {
  pattern: string
}

export interface Mapping extends PlatformArch {
  from: string
  to: string
}

export interface BundleConfig {
  targets: Target[]
  before: RunStep[]
  run: RunStep[]
  packages: Package[]
  includes: Pattern[]
  excludes: Pattern[]
  map: Mapping[]
  output: {
    dir: string
    name: string,
    prefix: string
  }
}

export const extendConfig = (config: any, platform: string, arch: string) => {
  config.targets = config.targets || [{ platform, arch, command: false }]
  config.before = toList(config.before).map(toRunStep)
  config.run = toList(config.run).map(toRunStep)
  config.packages = toList(config.packages).map(toPackage)
  config.includes = toList(config.includes).map(toPattern)
  config.excludes = toList(config.excludes).map(toPattern)
  config.map = toList(config.map).map(toMappping)
  config.output = Object.assign({ dir: 'dist', name: 'app', prefix: '' }, config.output)
  return config
}

export const readConfig = async (file: string, platform: string, arch: string): Promise<BundleConfig> => {
  const data = await fs.readFile(file, 'utf8')
  try {
    const config = yaml.parse(data)
    return extendConfig(config, platform, arch)
  } catch (e) {
    return Promise.reject(e)
  }
}

const toRunStep = (a: any): RunStep => {
  if (isString(a)) {
    return {
      command: a.split(/\s+/),
    }
  } else if (isArray(a)) {
    return {
      command: a
    }
  }
  if (!a.command) {
    throw new Error(`Invalid command: ${a}`)
  } else if (isString(a.command)) {
    a.command = a.command.split(/\s+/)
  }
  return a
}

const toPackage = (a: any): Package => {
  if (isString(a)) {
    return {
      name: a,
    }
  }
  if (isString(a?.name)) {
    return a
  }
  throw new Error(`Invalid package: ${a}`)
}

const toPattern = (a: any): Pattern => {
  if (isString(a)) {
    return {
      pattern: a
    }
  }
  if (!isObject(a) || !a.pattern) {
    throw new Error(`Invalid pattern: ${a}`)
  }
  return a
}

const toMappping = (a: any): Mapping => {
  if (!isObject(a)) {
    return {
      from: '',
      to: ''
    }
  }
  if (!a.from || !a.to) {
    const entries = Object.entries(a)
    if (!entries.length || !entries[0][0] || !entries[0][1]) {
      return {
        from: '',
        to: ''
      }
    }
    return {
      from: entries[0][0],
      to: `${entries[0][1]}`
    }
  }
  return a
}