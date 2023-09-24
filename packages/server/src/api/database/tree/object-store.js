const { createHash } = require('@home-gallery/common')

const createTree = (name) => ({type: 'tree', name, hash: null, files: []})

const createFile = (file) => ({type: 'entry', name: file.name, hash: file.entry.hash, entry: file.entry})

class ObjectStoreVisitor {
  mergeCount
  rootId
  store = {}
  paths = []

  constructor(mergeCount = 0) {
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
    const parent = this.paths[this.paths.length - 1]
    parent.files.push(createFile(file))
  }

  afterDir() {
    const tree = this.paths.pop()
    if (tree.fileCount == 0 && this.paths.length) {
      return
    } else if (this.mergeCount > 0 && this.paths.length) {
      this.flattenTree(tree)
    }
    const data = tree.files.map(file => `${file.hash}  ${file.name}`).join('\n')
    tree.hash = createHash(data)
    this.store[tree.hash] = tree.files

    if (!this.paths.length) {
      this.rootId = tree.hash
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

class ObjectStore {
  store = {}

  addFileStore(fileStore, mergeCount = 0) {
    const visitor = new ObjectStoreVisitor(mergeCount)
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

module.exports = {
  ObjectStore
}
