export const getPath = entry => {
  const firstFile = entry?.files?.[0]
  if (!firstFile) {
    return 'unknownPath'
  }
  return `${firstFile.index}/${firstFile.filename?.replaceAll('\\', '/')}`
}

const createEntryNode = entry => {
  const path = getPath(entry)
  const name = path.substring(path.lastIndexOf('/') + 1)

  return {type: 'entry', path, name, entry}
}

const createTree = (path = '', name = '') => ({type: 'tree', path, name, files: []})

const getParent = (path, parents) => {
  const parent = parents[path]
  if (parent) {
    return parent
  }

  let pos = path.lastIndexOf('/')
  const grantParent = getParent(path.substring(0, pos), parents)

  const name = path.substring(pos + 1)
  const tree = createTree(path, name)
  grantParent.files[name] = tree
  parents[path] = tree

  return tree
}

const walker = (node, visitor) => {
  if (node.type != 'tree') {
    if (typeof visitor?.visitFile == 'function') {
      visitor.visitFile(node)
    }
    return
  }

  if (typeof visitor?.beforeDir == 'function') {
    if (!visitor.beforeDir(node)) {
      return
    }
  }
  const fileEntries = Object.entries(node.files).sort(([a], [b]) => a <= b ? -1 : 1)
  fileEntries.forEach(([_, node]) => walker(node, visitor))

  if (typeof visitor?.afterDir == 'function') {
    visitor.afterDir(node)
  }
}

export class FileStore {
  root
  paths = {}

  constructor() {
    this.root = createTree()
  }

  addEntries(entries) {
    const nodes = entries.map(createEntryNode)
    const parents = {'': this.root}
    nodes.forEach(node => {
      const pos = node.path.lastIndexOf('/')
      const parent = getParent(node.path.substring(0, pos), parents)
      parent.files[node.name] = node
      this.paths[node.path] = node
    })
  }

  getByPath(path) {
    return this.paths[path]
  }

  getNodes() {
    return Object.values(this.paths)
  }

  walk(visitor) {
    walker(this.root, visitor)
  }
}
