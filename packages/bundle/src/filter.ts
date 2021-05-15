import path from 'path'
import globToRegExp from 'glob-to-regexp'

import { logger } from './log'
import { findPackageDir } from './dependency-tree'
import { PlatformArch, Pattern } from './config'
import { toList, uniq, ignoreBaseDir } from './utils'

const log = logger.child({module: 'filter'})

const matchTargets = (targets: string[], target: string): boolean => {
  const denied = targets.filter(t => t.substr(0, 1) == '!').map(t => t.substr(1))
  if (denied.length && denied.indexOf(target) >= 0) {
    return false
  }

  const allowed = targets.filter(t => t.substr(0, 1) != '!')
  if (!allowed.length) {
    return true
  }

  return allowed.indexOf(target) >= 0
}

export const matchPlatformArch = (target: PlatformArch, platform: string, arch: string) => {
  if (target.platform && !matchTargets(toList(target.platform), platform)) {
      return false
  }
  if (target.arch && !matchTargets(toList(target.arch), arch)) {
      return false
  }
  if (target.platformArch && !matchTargets(toList(target.platformArch), `${platform}-${arch}`)) {
    return false
  }
  return true
}

const getDirs = (file: string) => {
  let dir = file
  const dirs = [dir]
  while (true) {
    const parent = path.dirname(dir)
    if (dir == parent) {
      break;
    }
    dir = parent
    dirs.push(dir)
  }

  return dirs;
}

const getPackageDirFilter = (packages: string[]) => {
  const dirs = packages
    .map(getDirs)
    .reduce((r, v) => r.concat(v), [])
    .filter(uniq)
    .filter(ignoreBaseDir)
    .sort()

  return (file: string) => {
    if (dirs.indexOf(file) >= 0) {
      return true
    }
  }
}

const getPackageFileFilter = (packages: string[]) => {
  return (file: string) => {
    const packageDir = findPackageDir(file)
    return packages.indexOf(packageDir) >= 0
  }
}

const isNodeModulesBinFile = (file: string) => {
  const basenames = []
  let dir = file;
  while (basenames.length < 3) {
    basenames.push(path.basename(dir))
    dir = path.dirname(dir)
  }

  return (basenames[2] == '.bin' && basenames[1] == 'node_modules') ||
   (basenames[1] == '.bin' && basenames[0] == 'node_modules')
}

const toPackageFilter = (packages: string[]) => {
  const isPackageDir = getPackageDirFilter(packages)
  const isPackageFile = getPackageFileFilter(packages)

  return (file: string) => (isPackageDir(file) || isPackageFile(file)) && !isNodeModulesBinFile(file)
}

interface FilterFunctionReducer {
  (result: FilterFunction[], value: string): FilterFunction[]
}

export interface FilterFunction {
  (file: string): boolean;
}

const includePatternReducer = (result: FilterFunction[], pattern: string) => {
  result.push((file: string) => {
    const result = file.length < pattern.length ? pattern.indexOf(file) >= 0 : file.indexOf(pattern) >= 0
    //log.trace(`test simple pattern '${file}' with ${pattern}: ${result}`)
    return result
  })
  if (pattern.match(/[?*]/)) {
    const matcher = globToRegExp(pattern)
    result.push((file: string) => matcher.test(file))
  }
  return result
}

const excludeFilterReducer = (result: FilterFunction[], pattern: string) => {
  const matcher = globToRegExp(pattern)
  result.push((file: string) => matcher.test(file))
  return result
}

const toFilter = (patterns: string[], reducer: FilterFunctionReducer) => {
  if (!patterns.length) {
    return () => false
  }

  const filters = patterns.reduce(reducer, [])

  return (file: string) => !!filters.find(filter => filter(file))
}

export const getFilter = (packages: string[], includes: Pattern[], excludes: Pattern[], platform: string, arch: string): FilterFunction  => {
  const includePatterns = includes.filter(pattern => matchPlatformArch(pattern, platform, arch)).map(pattern => pattern.pattern)
  const excludePatterns = excludes.filter(pattern => matchPlatformArch(pattern, platform, arch)).map(pattern => pattern.pattern)

  packages.forEach(name => log.debug(`Create filter: Add package ${name}`))
  includePatterns.forEach(pattern => log.debug(`Create filter: Include ${pattern}`))
  excludePatterns.forEach(pattern => log.debug(`Create filter: Exclude ${pattern}`))

  const packageFilter = toPackageFilter(packages)
  const includeFilter = toFilter(includePatterns, includePatternReducer)
  const excludeFilter = toFilter(excludePatterns, excludeFilterReducer)

  return (file: string) => {
    const p = packageFilter(file)
    const i = includeFilter(file)
    const e = excludeFilter(file)
    const allow = ((p || i) && !e)
    log.trace(`Filter for ${file}: ${allow} by package: ${p}, include: ${i}, exclude: ${e}`)
    return allow
  }
}
