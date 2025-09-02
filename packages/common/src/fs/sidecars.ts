
type ISlimEntry = {
  filename: string
  size: number
  sidecars?: ISlimEntry[]
}

const bySize = (a: ISlimEntry, b: ISlimEntry) => a.size < b.size ? 1 : -1

const byFilename = (a: ISlimEntry, b: ISlimEntry) => a.filename < b.filename ? -1 : 1

const parseNameExt = (filename: string) => {
  const lastSlash = filename.lastIndexOf('/')
  const lastBackslash = filename.lastIndexOf('\\')

  const basename = filename.slice(Math.max(lastSlash, lastBackslash) + 1)
  const lastDot = basename.lastIndexOf('.')

  if (lastDot < 1) {
    return {
      name: basename,
      ext: ''
    }
  }
  return {
    name: basename.slice(0, lastDot),
    ext: basename.slice(lastDot + 1)
  }
}


function toPrimaryEntry(entries: ISlimEntry[]): ISlimEntry {
  const primary = entries[0]
  if (entries.length > 1) {
    primary.sidecars = entries.slice(1)
  }

  return primary
}

/**
 * Strip one or two extensions to group files with their sidecars, sorted by their size
 * The main file will be the largest one
 *
 * Example: IMG_2635.AVI, IMG_2635.THM, IMG_2635.AVI.xmp -> group(IMG_2635)
 */
export const mapName2Sidecars = (entries: ISlimEntry[]) => {
  const result: Record<string, ISlimEntry[]> = {}
  entries.sort(bySize).forEach(entry => {
    const { name, ext } = parseNameExt(entry.filename)
    const { name: name2, ext: ext2 } = parseNameExt(name)
    if (ext && result[name]) {
      result[name].push(entry)
    } else if (ext2 && result[name2]) {
      result[name2].push(entry)
    } else if (ext) {
      result[name] = [entry]
    }
  })
  return result
}

export const groupSidecarFiles = (entries: ISlimEntry[]) => {
  const name2Sidecars = mapName2Sidecars(entries)

  const sidecarEntries = Object.values(name2Sidecars).map(toPrimaryEntry);
  return sidecarEntries.sort(byFilename)
}

export const getSidecarsByFilename = (name2sidecars, filename) => {
  const { name, ext } = parseNameExt(filename)
  const { name: name2, ext: ext2 } = parseNameExt(name)
  if (ext && name2sidecars[name]) {
    return name2sidecars[name]
  } else if (ext2 && name2sidecars[name2]) {
    return name2sidecars[name2]
  }
  return false
}

export const ungroupSidecarFiles = (entry: ISlimEntry) => {
  const result: ISlimEntry[] = []
  if (entry.sidecars?.length) {
    result.push(...entry.sidecars)
    entry.sidecars.splice(0, entry.sidecars.length)
  }
  result.push(entry)
  return result.sort(byFilename)
}
