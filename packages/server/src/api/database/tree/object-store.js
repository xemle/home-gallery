import { createHash } from '@home-gallery/common'

const createTree = (name) => ({type: 'tree', name, hash: null, files: []})

const createFile = (file, mapEntry) => {
  const entry = mapEntry(file.entry)
  return {type: 'entry', name: file.name, hash: entry.hash, entry}
}

class ObjectStoreVisitor {
  mergeCount
  rootId
  store = {}
  paths = []

  constructor(entryFilter, mapEntry, mergeCount = 0) {
    this.entryFilter = entryFilter
    this.mapEntry = mapEntry
    this.mergeCount = mergeCount
  }

  flattenTree(tree) {
    const subTreeObjectCount = tree.files
      .reduce((count, file) => {
        if (file.type == 'tree') {
          const subFiles = this.store[file.hash]
          return count + subFiles.length
        }
        return count + 1
      }, 0)

    if (subTreeObjectCount > this.mergeCount) {
      return
    }

    tree.files = tree.files
      .reduce((result, file) => {
        if (file.type == 'tree') {
          const name = file.name
          const subFiles = this.store[file.hash]
          subFiles.forEach(subFile => {
            result.push({...subFile, name: `${name}/${subFile.name}`})
          })
          return result
        }
        result.push(file)
        return result
      }, [])
  }

  beforeDir(dir) {
    this.paths.push(createTree(dir.name))
    return true
  }

  visitFile(file) {
    if (!this.entryFilter(file.entry)) {
      return
    }
    const parent = this.paths[this.paths.length - 1]
    parent.files.push(createFile(file, this.mapEntry))
  }

  afterDir() {
    const tree = this.paths.pop()
    if (tree.fileCount == 0 && this.paths.length) {
      return
    } else if (this.mergeCount > 0 && this.paths.length) {
      this.flattenTree(tree)
    }

    const isRoot = this.paths.length == 0
    const hasFiles = tree.files.length > 0
    if (isRoot || hasFiles) {
      const data = tree.files.map(file => `${file.hash}  ${file.name}`).join('\n')
      tree.hash = createHash(data)
      this.store[tree.hash] = tree.files
    }

    if (isRoot) {
      this.rootId = tree.hash
      return
    } else if (!hasFiles) {
      return
    }

    const parent = this.paths[this.paths.length - 1]
    parent.files.push({type: 'tree', name: tree.name, hash: tree.hash})
  }
}

const walker = (store, hash, visitor, name = '') => {
  const files = store[hash]
  if (!Array.isArray(files)) {
    return
  } else if (typeof visitor.beforeTree == 'function') {
    if (!visitor.beforeTree(name, files, hash)) {
      return
    }
  }
  for (let file of files) {
    if (file.type == 'tree') {
      walker(store, file.hash, visitor, file.name)
    } else if (typeof visitor.visitEntry == 'function') {
      visitor.visitEntry(file.name, file.entry, file.hash)
    }
  }
  if (typeof visitor.afterTree == 'function') {
    visitor.afterTree(name, files, hash)
  }
}

export class ObjectStore {
  store = {}

  addFileStore(fileStore, entryFilter = () => true, mapEntry = entry => entry, mergeCount = 0) {
    const visitor = new ObjectStoreVisitor(entryFilter, mapEntry, mergeCount)
    fileStore.walk(visitor)
    walker(visitor.store, visitor.rootId, {
      beforeTree: (_, files, hash) => {
        this.store[hash] = files
        return true
      }
    })
    return visitor.rootId
  }

  getByHash(hash) {
    return this.store[hash]
  }

  walk(root, visitor) {
    walker(this.store, root, visitor)
  }
}
