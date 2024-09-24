import fs from 'fs/promises'
import path from 'path'

export const selectSidecar = (main, files = []) => {
  let sidecar
  sidecar = files.find(f => f.startsWith(main) && f.substring(main.length).toLowerCase() == '.xmp')
  if (sidecar) {
    return sidecar
  }

  const name = main.substring(0, main.lastIndexOf('.'))
  sidecar = files.find(f => f.startsWith(name) && f.substring(name.length).toLowerCase() == '.xmp')
  if (sidecar) {
    return sidecar
  }

  return `${main}.xmp`
}

const byLengthDesc = (a, b) => {
  let cmp = a.length - b.length
  if (cmp != 0) {
    return cmp
  }
  return a < b ? -1 : 1
}

const listFiles = async (dir) => {
  const filesWithTypes = await fs.readdir(dir, {withFileTypes: true})
  const files = filesWithTypes.filter(f => f.isFile()).map(f => f.name)
  files.sort(byLengthDesc)
  return files
}

export const findSidecar = async (filename) => {
  const dir = path.dirname(filename)

  const files = await listFiles(dir)
  const sidecar = selectSidecar(path.basename(filename), files)
  return path.join(dir, sidecar)
}
