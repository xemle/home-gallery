import { Entry } from "../store/entry";

type DbUpgrade = (db: IDBDatabase, oldVersion: number) => void

export const loadIndexedDb = async(name: string, version: number, upgrade: DbUpgrade): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error(`IndexedDb is not supported`))
    }
    const req = window.indexedDB.open(name, version);
    req.onsuccess = () => {
      resolve(req.result as IDBDatabase)
    }
    req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      upgrade(req.result, event.oldVersion)
    }
    req.onerror = (err) => reject(err)
  })
}

export interface TreelikeChild {
  type: string
  hash: string
  name: string
  entry?: Entry
}

export interface Treelike {
  hash: string
  data: TreelikeChild[]
}


export type BeforeTreeFn = (hash: string, tree: Treelike | null) => boolean
export type EntryFn = (entry: Entry) => void

export interface TreeVisitor {
  beforeTree: BeforeTreeFn
  onEntry: EntryFn
}

export type PurgeFn = (hash: string) => boolean

export class OfflineDatabase {
  database: IDBDatabase

  constructor(database: IDBDatabase) {
    this.database = database
  }

  async updateTrees(trees: Treelike[]) : Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readwrite')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }

      const store = tx.objectStore('trees')
      trees.forEach(tree => store.put(tree, tree.hash))

      tx.onabort = reject
      tx.onerror = reject
      tx.oncomplete = () => resolve()
    })
  }

  async setRoot(root: Treelike, refName : string = 'root') : Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readwrite')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }

      const store = tx.objectStore('trees')
      store.put(root, refName)

      tx.onabort = reject
      tx.onerror = reject
      tx.oncomplete = () => resolve()
    })
  }

  async getTree(hash: string) : Promise<Treelike> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readonly')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }

      const store = tx.objectStore('trees')
      const req = store.get(hash)
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result)
        } else {
          reject(new Error(`Could not find tree by key ${hash}`))
        }
      }

      tx.onabort = reject
      tx.onerror = reject
    })
  }

  async getMissingTrees(hashes: string[]) : Promise<string[]> {
    if (!hashes.length) {
      return Promise.resolve([])
    }
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readonly')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }

      const store = tx.objectStore('trees')
      const missingHashes: string[] = []
      hashes.forEach(hash => {
        const req = store.get(hash)
        req.onsuccess = () => {
          if (!req.result && !missingHashes.includes(hash)) {
            missingHashes.push(hash)
          }
        }
      })

      tx.onabort = reject
      tx.onerror = reject
      tx.oncomplete = () => resolve(missingHashes)
    })
  }

  async purge(purgeFn: PurgeFn): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readwrite')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }
      const store = tx.objectStore('trees')
      const req = store.openCursor()
      req.onsuccess = () => {
        let cursor: IDBCursorWithValue | null = req.result
        if (!cursor) {
          resolve()
        } else if (purgeFn(cursor.value.hash)) {
          cursor.delete()
        }
        cursor?.continue()
      }
      req.onerror = (err) => {
        reject(new Error(`Failed to read: ${err}`))
      }
    })
  }

  async getAllTrees(): Promise<Treelike[]> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readonly')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }
      const result: Treelike[] = []
      const store = tx.objectStore('trees')
      const req = store.openCursor()
      req.onsuccess = () => {
        let cursor: IDBCursorWithValue | null = req.result
        if (cursor) {
          result.push(cursor.value as Treelike)
          cursor.continue()
        } else {
          resolve(result)
        }
      }
      req.onerror = (err) => {
        throw new Error(`Failed to read: ${err}`)
      }
    })
  }

  async walkTree(rootHash: string, treeVisitor: TreeVisitor): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.database.transaction(['trees'], 'readonly')
      if (!tx) {
        return reject(new Error(`Failed to create a database transaction`))
      }
      const store = tx.objectStore('trees')

      const walk = (root: Treelike) => {
        for (let child of root.data) {
          if (child.type == 'tree') {
            handleTree(child.hash)
          } else if (child.entry) {
            treeVisitor.onEntry(child.entry)
          }
        }
      }

      const handleTree = (hash: string) => {
        const req = store.get(hash)
        req.onsuccess = () => {
          const tree = req.result
          const visitChildTree = treeVisitor.beforeTree(hash, tree)
          if (tree && visitChildTree) {
            walk(tree)
          }
        }
      }

      handleTree(rootHash)

      tx.onabort = reject
      tx.onerror = err => reject(err)
      tx.oncomplete = () => resolve()
    })

  }
}

export const loadDatabase = async () : Promise<OfflineDatabase> => {
  const version = 2
  const db = await loadIndexedDb('gallery', version, (db, oldVersion) => {
    switch(oldVersion) {
      case 0: {
        db.createObjectStore('trees')
      }
    }
    console.log(`Upgrade offline database with version ${version}`)
  })
  return new OfflineDatabase(db)
}
