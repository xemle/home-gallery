import picomatch from 'picomatch'

const defaultExcludes = [
  '.git',
  'CVS',
  '.svn',
  '.hg',
  '.lock-wscript',
  '.wafpickle-N',
  '.*.swp',
  '.DS_Store',
  '._*',
  'npm-debug.log',
  '.npmrc',
  'node_modules',
  'config.gypi',
  '*.orig',
  'package-lock.json',
]

const defaultIncludes = [
  'package.json',
  'README',
  'LICENSE',
  'LICENCE'
]

const convertToPattern = (path: string) => path.match(/(^!|[*])/) ? path : `${path.replace(/\/$/, '')}/**`

const defaultExcludeMatcher = picomatch(defaultExcludes.map(convertToPattern))

export const defaultExcludeFileFilter = (path: string) => !defaultExcludeMatcher(path)

export function createIncludeFileFilter(pkg: any) {
  if (!pkg.files) {
    return () => true
  }

  const includePatterns = [...defaultIncludes, ...pkg.files, pkg.main]
    .filter(v => !!v)
    .map(convertToPattern)
  const includes = picomatch(includePatterns)

  return (path: string) => includes(path)
}