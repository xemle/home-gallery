import globToRegExp from 'glob-to-regexp'

import { logger } from './log.js'
import { PlatformArch, Pattern } from './config.js'
import { toList } from './utils.js'

const log = logger('filter')

const matchTargets = (targets: string[], target: string): boolean => {
  const denied = targets.filter(t => t.startsWith('!')).map(t => t.substring(1))
  if (denied.length && denied.indexOf(target) >= 0) {
    return false
  }

  const allowed = targets.filter(t => !t.startsWith('!'))
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

const toPackageFileFilter = (packageFiles: string[]) => {
  return (file: string) => !!packageFiles.find(f => f.startsWith(file))
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

export const getFilter = (packageFiles: string[], includes: Pattern[], excludes: Pattern[], platform: string, arch: string): FilterFunction  => {
  const includePatterns = includes.filter(pattern => matchPlatformArch(pattern, platform, arch)).map(pattern => pattern.pattern)
  const excludePatterns = excludes.filter(pattern => matchPlatformArch(pattern, platform, arch)).map(pattern => pattern.pattern)

  includePatterns.forEach(pattern => log.debug(`Create filter: Include ${pattern}`))
  excludePatterns.forEach(pattern => log.debug(`Create filter: Exclude ${pattern}`))

  const packageFileFilter = toPackageFileFilter(packageFiles)
  const includeFilter = toFilter(includePatterns, includePatternReducer)
  const excludeFilter = toFilter(excludePatterns, excludeFilterReducer)

  return (file: string) => {
    const p = packageFileFilter(file)
    const i = includeFilter(file)
    const e = excludeFilter(file)
    const allow = ((p || i) && !e)
    log.trace(`Filter for ${file}: ${allow} by package: ${p}, include: ${i}, exclude: ${e}`)
    return allow
  }
}
