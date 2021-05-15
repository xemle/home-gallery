import os from 'os'
import fs from 'fs/promises'
import yaml from 'yaml'

import { isString, isArray, toList, isObject } from './utils'

export interface Target {
  platform: string,
  arch: string,
  command: string[]
}

export interface PlatformArch {
  platform?: string | string[]
  arch?: string | string[]
  platformArch?: string | string[]
}

export interface RunStep extends PlatformArch {
  command: string[]
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
  entries: string[]
  includes: Pattern[]
  excludes: Pattern[]
  map: Mapping[]
  output: {
    dir: string
    name: string,
    prefix: string
  }
}

export const readConfig = async (file: string): Promise<BundleConfig> => {
  const data = await fs.readFile(file, 'utf8')
  try {
    const config = yaml.parse(data)
    config.targets = config.targets || [{ platform: os.platform(), arch: os.arch(), command: ['echo', 'App in {{caxa}}'] }]
    config.before = toList(config.before).map(toRunStep)
    config.run = toList(config.run).map(toRunStep)
    config.entries = config.entries || []
    config.includes = toList(config.includes).map(toPattern)
    config.excludes = toList(config.excludes).map(toPattern)
    config.map = toList(config.map).map(toMappping)
    config.output = Object.assign({ dir: 'dist', name: 'app', prefix: '' }, config.output)
    return config
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
    const key = Object.keys(a).pop()
    if (!key) {
      return {
        from: '',
        to: ''
      }
    }
    return {
      from: key,
      to: a[key]
    }
  }
  return a
}