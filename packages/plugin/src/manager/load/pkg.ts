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
  while (typeof result == 'object' && i < parts.length) {
    result = result[parts[i++]]
  }
  return result
}

const entryPaths = [
  'exports',
  'exports.module',
  'exports.node',
  'exports.node.module',
  'exports.\'.\'.module',
  'exports.\'.\'.node',
  'exports.\'.\'.node.module',
  'main'
]

export function resolvePackageEntry(pkg: any) {
  for (let path of entryPaths) {
    const entry = getPath(pkg, path)
    if (typeof entry == 'string') {
      return entry
    }
  }
}

