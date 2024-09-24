const PATH_PATTERN = /([^'.]+|'[^']+')\.?/g // name. or 'name'.

function getPath(o: any, path: string) {
  const parts: string[] = []
  for (const match of path.matchAll(PATH_PATTERN)) {
    const [_, name] = match
    const part = name.startsWith('\'') ? name.substring(1, name.length - 1) : name
    parts.push(part)
  }

  let result = o
  let i = 0
  while (result && i < parts.length) {
    if (typeof result == 'object') {
      result = result[parts[i++]]
    } else {
      result = undefined
    }
  }
  return result
}

const nodeEntryPaths = [
  'exports',
  'exports.module',
  'exports.node',
  'exports.node.module',
  'exports.\'.\'.module',
  'exports.\'.\'.node',
  'exports.\'.\'.node.module',
  'main'
]

const browserEntryPaths = [
  'exports.browser',
  'exports.\'.\'.browser',
  'browser'
]

export function resolvePackageEntry(pkg: any) {
  for (let path of nodeEntryPaths) {
    const entry = getPath(pkg, path)
    if (typeof entry == 'string') {
      return entry
    }
  }
}

export function resolveBrowserEntry(pkg: any) {
  for (let path of browserEntryPaths) {
    const entry = getPath(pkg, path)
    if (typeof entry == 'string') {
      return entry
    }
  }
}

