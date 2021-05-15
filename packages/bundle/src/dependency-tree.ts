import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

import { logger } from './log'
import { uniq, ignoreBaseDir, isObject } from './utils'

const log = logger.child({ module: 'dependency-tree' })

const fileExists = (file: string) => fs.access(file).then(() => true).catch(() => false)

const readPackage = async (packageFile: string): Promise<any> => {
    const data = await fs.readFile(packageFile, 'utf8')
    log.trace(`Reading package ${packageFile}`)
    return JSON.parse(data)
}

const addChildModules = (module: NodeModule, modules: { [id: string]: NodeModule }) => {
    module.children.forEach((child: NodeModule) => {
        if (!modules[child.id]) {
            modules[child.id] = child;
            log.trace(`Add dependency ${child.id} from ${module.id}`)
            addChildModules(child, modules)
        }
    })
}

const loadModule = (filename: string): NodeModule | undefined => {
    try {
        require(filename)
    } catch (e) {
        log.error(`Failed to load module from ${filename}: ${e}`)
        return
    }

    return require.cache[filename];
}

const resolveFile = async (filename: string): Promise<string[]> => {
    const stat = await fs.stat(filename)
    if (stat.isDirectory()) {
        return resolveFile(path.join(filename, 'index.js'))
    } else if (!stat.isFile()) {
        log.warn(`Entry is not a directory nor a file: ${filename}`)
        return []
    }

    const module = loadModule(filename)
    if (!module) {
        return [filename]
    }

    const allModules: { [id: string]: NodeModule } = {};
    allModules[module.id] = module;
    addChildModules(module, allModules)

    return Object.values(allModules)
        .map((module: NodeModule) => module.filename)
}

export const findPackage = async (dir: string, name: string): Promise<string | false> => {
  if (!dir || dir == '/') {
    return false;
  }
  const packageDir = path.join(dir, 'node_modules', name);
  const found = await fileExists(path.join(packageDir, 'package.json'))
  if (found) {
    return packageDir
  }
  return findPackage(path.dirname(dir), name)
}

export const findPackageDir = (filename: string) => {
    let packageDir = path.dirname(filename);
    while (!existsSync(path.join(packageDir, 'package.json'))) {
        const parentDir = path.dirname(packageDir)
        if (parentDir == packageDir) {
            packageDir = filename
            break
        }
        packageDir = parentDir
    }
    return packageDir
}

const resolvePackage = async (packageDir: string, name: string, property: string | undefined) => {
    const pkg: any = await readPackage(path.join(packageDir, 'package.json'))
    const pkgEntries: any = pkg[property || 'main'] || 'index.js'
    if (typeof pkgEntries == 'string') {
        log.trace(`Resolving package property ${property || 'main'} from package '${name}'`)
        return resolveFile(path.join(packageDir, pkgEntries))
    } else if (!isObject(pkgEntries)) {
        log.warn(`package.json property '${property}' is not an object from package ${name}: ${typeof pkgEntries}`)
        log.trace(JSON.stringify(pkg, null, 2))
        return []
    }
    const pkgDependencies = Object.keys(pkgEntries)
    log.trace(`Resolving package dependencies ${pkgDependencies.join(', ')} from package '${name}' in dir ${packageDir}`)
    const files = await Promise.all(pkgDependencies.map(entry => resolveFiles(packageDir, entry)))
    return files.reduce((result: string[], entries: string[]) => result.concat(entries), [])
}

const resolveRelative = async (filename: string, name: string, property: string | undefined) => {
    let stat = await fs.stat(filename)
    if (stat.isFile()) {
        log.trace(`Resolving file entry ${filename}`)
        return resolveFile(filename)
    } else if (!stat.isDirectory()) {
        log.trace(`Expect entry to by a file or directory ${filename}`)
        return []
    }
    stat = await fs.stat(path.join(filename, 'package.json'))
    if (stat.isFile()) {
        return resolvePackage(filename, name, property)
    }
    stat = await fs.stat(path.join(filename, 'index.js'))
    if (!stat) {
        log.trace(`Missing index.js in directory ${filename}`)
        return []
    }
    return resolveFile(filename)
}

export const resolveFiles = async (baseDir: string, entry: string): Promise<string[]> => {
    const [name, property] = entry.split(':')
    const isRelative = entry.startsWith('.')

    if (isRelative) {
        const filename = path.join(baseDir, name)
        return resolveRelative(filename, name, property)
    }
    const packageDir = await findPackage(baseDir, name)
    if (!packageDir) {
        log.warn(`Could not find package dir of package ${name}`)
        return []
    }
    return resolvePackage(packageDir, name, property)
}

export const resolvePackages = async (baseDir: string, entries: string[]): Promise<string[]> => {
    const files = await Promise.all(entries.map(entry => resolveFiles(baseDir, entry)))

    return files
        .reduce((result: string[], files: string[]) => result.concat(files), [])
        .map(filename => path.relative(baseDir, filename))
        .map(findPackageDir)
        .filter(uniq)
        .filter(ignoreBaseDir)
        .sort()
}
