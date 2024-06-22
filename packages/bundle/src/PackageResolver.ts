import fs from 'fs/promises'
import path from 'path'

import { logger } from './log.js'
import { Package } from './Package.js'

const log = logger('packageResolver')

type PackageCache = {
  [key: string]: Package
}

export type ResolveOptions = {
  isOptional?: boolean
  omitOptional?: boolean
  platform?: string
  arch?: string
}

const filterObjectByKeys = (obj: any, keys: string[]) => Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)))

export class PackageReolver {
  baseDir: string
  cache: PackageCache = {}

  constructor(baseDir: string) {
    this.baseDir = baseDir
  }

  private loadPackage(dir: string) {
    const packageFilename = path.join(dir, 'package.json')
    return fs.readFile(packageFilename, { encoding: 'utf-8' })
      .then(JSON.parse)
      .then(pkg => new Package(dir, pkg))
  }

  private findPackage(dir: string, name: string): Promise<Package> {
    const packageDir = path.join(dir, 'node_modules', name)
    if (this.cache[packageDir]) {
      return Promise.resolve(this.cache[packageDir])
    }
    const packageFilename = path.join(packageDir, 'package.json')
    return fs.access(packageFilename)
      .then(() => this.loadPackage(packageDir))
      .catch(() => {
        if (!dir || dir == '/') {
          throw new Error(`Could not find package ${name} in ${dir}`)
        }
        const dirname = path.dirname(dir)
        return this.findPackage(dirname, name)
      })
  }

  private async findPackageDependency(dir: string, name: string, version: string, options: ResolveOptions) {
    if (version.match(/^file:/)) {
      const moduleDir = path.resolve(this.baseDir, dir)
      const relative = './' + path.relative(moduleDir, path.resolve(moduleDir, version.substring(5)))
      log.trace(`Add relative dependency ${name} from ${relative} in ${moduleDir}`)
      return this.addPackage(relative, moduleDir, options)
    }
    return this.addPackage(name, dir, options)
  }

  private async findPackageDependencies(module: Package, dependencies: {[key: string]: string}, options : ResolveOptions): Promise<void> {
    const deps: [string, string][] = Object.entries(dependencies)
    if (!deps.length) {
      return
    }
    log.trace(`Add ${options.isOptional ? 'optional' : 'required'} dependencies: ${deps.map(([name]) => name).join(', ')}`)
    const children = await Promise.all(deps.map(([name, version]) => this.findPackageDependency(module.dir, name, version, options)))
    module.children = children.filter(c => c instanceof Package) as Package[]
  }

  private async addToCache(name: string, module: Package, options: ResolveOptions) {
    if (this.cache[module.dir]) {
      log.trace(`Cache hit: Package ${name} in ${module.dir}`)
      return this.cache[module.dir]
    } else if (options.isOptional && !module.matchesPlatformArch(options.platform, options.arch)) {
      throw new Error(`Module ${name} in ${module.dir} does not match target platform ${options.platform || '*'} or arch ${options.arch || '*'}`)
    }

    log.debug(`Found ${name} in ${module.dir}`)
    this.cache[module.dir] = module
    await this.addPackageDependencies(module, options)
    return module
  }

  private async addPackageDependencies(module: Package, options: ResolveOptions) {
    if (typeof module.pkg.bundleDependencies != 'undefined' ||
      typeof module.pkg.bundledDependencies != 'undefined') {
      return this.addBundleDependencies(module, options)
    }
    await this.findPackageDependencies(module, module.pkg.dependencies || {}, {...options, isOptional: false})
    if (!options.omitOptional) {
      await this.findPackageDependencies(module, module.pkg.optionalDependencies || {}, {...options, isOptional: true})
    }
  }

  private async addBundleDependencies(module: Package, options: ResolveOptions) {
    const bundleDependencies = typeof module.pkg.bundleDependencies != 'undefined' ? module.pkg.bundleDependencies : module.pkg.bundledDependencies
    if (bundleDependencies === false) {
      return
    }

    const allDependencies = {...module.pkg.dependencies, ...module.pkg.optionalDependencies}
    if (bundleDependencies === true) {
      return this.findPackageDependencies(module, allDependencies, {...options, isOptional: false})
    } else if (Array.isArray(bundleDependencies)) {
      const dependencies = filterObjectByKeys(allDependencies, bundleDependencies) as {[key: string]: string}
      return this.findPackageDependencies(module, dependencies, {...options, isOptional: false})
    }
  }

  async addPackage(name: string, dir: string = '.', options : ResolveOptions = {}): Promise<Package | void> {
    const allowOptional = (err: any) => {
      if (options.isOptional) {
        log.debug(`Skip optional package ${name} with error: ${err.message}`)
        return Promise.resolve()
      }
      return Promise.reject(err)
    }

    const packagePromise = name.startsWith('.')
      ? this.loadPackage(path.resolve(this.baseDir, dir, name))
      : this.findPackage(path.resolve(this.baseDir, dir), name)

    return packagePromise
      .then(module => this.addToCache(name, module, options))
      .catch(allowOptional)
  }

  async addPackages(names: string[], dir: string = '.', options : ResolveOptions = {}) : Promise<void> {
    let i = 0
    const next = async () : Promise<void> => {
      if (i == names.length) {
        return
      }
      await this.addPackage(names[i++], dir, options)
      return next()
    }

    return next()
  }

  get packageCount() {
    return Object.keys(this.cache).length
  }

  get packages() {
    return Object.values(this.cache).sort((a, b) => a.dir < b.dir ? -1 : 1)
  }

  get files(): Promise<string[]> {
    const isNodePackage = (module: Package) => !!path.relative(this.baseDir, module.dir).match(/node_modules/)
    const toModulePaths = (module: Package) => module.files(!isNodePackage(module)).then(files => files.map(file => path.join(module.dir, file)))
    const concatPaths = (allFiles: string[][]) => allFiles.reduce((result, files) => {
      result.push(...files)
      return result
    }, [] as string[])

    return Promise.all(this.packages.map(toModulePaths)).then(concatPaths)
  }
}