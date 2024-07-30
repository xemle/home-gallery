import fs, { access } from 'fs/promises'
import path from 'path'
import Mustache from 'mustache'
import { fileURLToPath } from 'url'

import Logger from '@home-gallery/logger'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const log = Logger('plugin.create')

export type TPluginCreateOptions = {
  name: string
  baseDir: string
  sourceType: 'typescript' | 'vanilla'
  modules?: string[]
  requires?: string[]
  force: boolean
}

export const createPlugin = async (options: any) => {
  const isSrc = path.basename(path.dirname(__dirname)) == 'src'
  const upDirs = isSrc ? ['..', '..'] : ['..']
  const templateDir = path.resolve(__dirname, ...upDirs, 'templates')

  const createOptions = options.config.createPlugin as TPluginCreateOptions

  const moduleDefaults : {[key: string]: any} = {
    extractor: {
      phase: 'file'
    },
    database: {

    },
    query: {

    },
  }

  const vars: {[key: string]: any} = {
    name: createOptions.name,
    sanitizedName: toSanitizeName(createOptions.name),
    dashName: toDashName(createOptions.name),
    camelName: toCamelName(createOptions.name),
    className: toClassName(createOptions.name),
    requires: createOptions.requires?.length ? createOptions.requires.map(r => `'${r}'`).join(', ') : '',
    modules: {

    } as any,
  }
  const templateBase = path.resolve(templateDir, createOptions.sourceType)
  access(templateBase).catch(() => { throw new Error(`Templates for source type ${createOptions.sourceType} not found ate ${templateDir}`) })
  const templateConfig = await readJson(path.resolve(templateBase, 'template.config.json'))

  const pluginDir = await getPluginDir(createOptions, templateConfig, vars)

  const files = [...templateConfig.files]
  const activeModules = createOptions.modules || Object.keys(vars.modules)
  activeModules.forEach((module: string) => {
    files.push(...(templateConfig.modules[module] || []))
    vars.modules[module] = moduleDefaults[module]
  })

  for (let file of files) {
    const template = await fs.readFile(path.resolve(templateDir, createOptions.sourceType, file), 'utf8')
    const rendered = Mustache.render(template, vars)

    const resolvedName = file.replace(/\.mustache$/, '')
      .replaceAll(/\[([^\]]+)\]/g, (_: string, varName: string) => {
        return vars[varName] || ''
      })
    const target = path.resolve(pluginDir, resolvedName)
    await fs.mkdir(path.dirname(target), {recursive: true})
    await fs.writeFile(target, rendered, 'utf8')
    log.trace(`Wrote plugin file ${target}`)
  }
  log.debug(`Wrote ${files.length} plugin template files`)
  return pluginDir
}

const getPluginDir = async (createOptions: any, templateConfig: any, vars: any) => {
  if (!templateConfig.dir) {
    return path.resolve(createOptions.baseDir)
  }

  const pluginDirName = templateConfig.dir.replaceAll(/\[([^\]]+)\]/g, (_: string, varName: string) => {
    return vars[varName] || ''
  })
  const pluginDir = path.resolve(createOptions.baseDir, pluginDirName)
  await access(pluginDir).then(() => {
    if (!createOptions.force) {
      throw new Error(`Plugin directory already exists: ${pluginDir}. Use --force to overwrite it`)
    }
  }, () => true)
  return pluginDir
}

const readJson = async (file: string): Promise<any> => {
  const data = await fs.readFile(file, 'utf8')
  return JSON.parse(data)
}

const toSanitizeName = (name: string) => name.replaceAll(/[^A-Za-z0-9]+/g, '-').replaceAll(/(^-+|-+$)/g, '')

const toDashName = (name: string) => {
  const sanitizedName = toSanitizeName(name)
  return sanitizedName.replaceAll(/[A-Z]+/g, (char: string, pos: number) => `${pos == 0 ? '' : '-'}${char.toLowerCase()}`).replaceAll(/-+/g, '-')
}

const toCamelName = (name: string) => {
  const dashName = toDashName(name)
  return dashName.replaceAll(/-[a-z]+/g, (char: string) => char.substring(1, 2).toUpperCase() + char.substring(2))
}

const toClassName = (name: string) => {
  const camelName = toCamelName(name)
  return camelName.charAt(0).toUpperCase() + camelName.slice(1)
}

const readDir = async (dir: string): Promise<string[]> => {
  const files = await fs.readdir(dir)
  const stats = await Promise.all(files.map(file => fs.stat(path.resolve(dir, file))))

  const result: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const isDir = stats[i].isDirectory()
    if (isDir) {
      const subFiles = await readDir(path.resolve(dir, file))
      result.push(...subFiles.map(subFile => path.resolve(file, subFile)))
    } else {
      result.push(file)
    }
  }
  return result
}