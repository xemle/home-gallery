import { walkDir } from './walk'
import { defaultExcludeFileFilter, createIncludeFileFilter } from './package-file-filter'

export class Package {
  dir: string
  pkg: any
  children: Package[] = []

  constructor(dir: string, pkg: any) {
    this.dir = dir
    this.pkg = pkg
  }

  private matchesPattern(list: string[], target: string | undefined) {
    if (!list || !target) {
      return true
    }
    const excludes = list.filter((item: string) => item.startsWith('!')).map((item: string) => item.substring(1))
    const includes = list.filter((item: string) => !item.startsWith('!'))
    return (!excludes.length || !excludes.includes(target)) && (!includes.length || includes.includes(target))
  }

  matchesPlatformArch(targetPlatform: string | undefined, targetArch: string | undefined) {
    return this.matchesPattern(this.pkg.os || [], targetPlatform) &&
      this.matchesPattern(this.pkg.cpu || [], targetArch)
  }

  async files(filterFiles = false): Promise<string[]> {
    if (filterFiles) {
      return walkDir(this.dir, '.', defaultExcludeFileFilter)
        .then(files => files.filter(createIncludeFileFilter(this.pkg)))
    }
    return walkDir(this.dir, '.', (path: string) => path != 'node_modules')
  }

}
