import { Entry } from "../store/entry";

type DbUpgrade = (db: IDBDatabase, oldVersion: number) => void

export interface TreelikeChild {
  type: string
  hash: string
  name: string
  data?: Entry
}

export interface Treelike {
  type: string
  hash: string
  data: TreelikeChild[]
}


/** Skip tree on falsy result */
export type BeforeTreeFn = (hash: string, tree: Treelike | null) => boolean
export type EntryFn = (entry: Entry) => void

export interface TreeVisitor {
  beforeTree: BeforeTreeFn
  onEntry?: EntryFn
}

export type PurgeFn = (hash: string) => boolean

type TaskItem<T> = {
  resolve: (result) => void
  reject: (err) => void
  run: () => Promise<T>
}

/**
 * Use one single function to be worker ready
 *
 * Up to now there is no performance benefit to move this logic to a worker.
 * Keep it for the sake of lazyness
 */
export function createOfflineDatabase(baseUrl, onEntriesSize = 5000) {
  const globalThis = typeof window != 'undefined' ? window : (typeof self != 'undefined' ? self : {})
  const version = 2
  let db: IDBDatabase | null = null

  /**
   * Utils
   */
  class TaskExecutor<T> {
    taskQueue: TaskItem<T>[] = []
    maxRunningCount: number
    runningCount = 0

    constructor(max) {
      this.maxRunningCount = max
    }

    queue(run: () => Promise<T>) {
      const task = new Promise((resolve, reject) => {
        this.taskQueue.push({resolve, reject, run})
      })
      this.execute()
      return task as Promise<T>
    }

    execute() {
      if (!this.taskQueue.length) {
        return
      }
      if (this.runningCount >= this.maxRunningCount) {
        return
      }
      this.runningCount++
      const task = this.taskQueue.shift()!

      task.run()
        .then(task.resolve, task.reject)
        .finally(() => {
          this.runningCount--
          this.execute()
        })
      this.execute()
    }
  }

  const fetchExecutor = new TaskExecutor<Treelike>(8)

  /**
   * IndexedDb logic
   */
  class TreeDatabase {
    db: IDBDatabase
    open() {
      return new Promise((resolve, reject) => {
        if (!('indexedDB' in globalThis)) {
          return reject(new Error(`IndexedDb is not supported`))
        }
        const req = globalThis.indexedDB?.open('gallery', version);
        req.onsuccess = () => {
          this.db = req.result
          resolve(true)
        }
        req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          this.upgrade(req.result, event.oldVersion)
        }
        req.onerror = (err) => reject(err)
      })
    }

    upgrade(db, oldVersion) {
      switch(oldVersion) {
        case 0: {
          db.createObjectStore('trees')
        }
      }
      console.log(`Upgrade offline database with version ${version}`)
    }

    addTree(tree: Treelike, refName?: string): Promise<Treelike> {
      return new Promise((resolve, reject) => {
        const tx = this.db?.transaction(['trees'], 'readwrite')
        if (!tx) {
          return reject(new Error(`Failed to create a database transaction`))
        }

        const store = tx.objectStore('trees')
        store.put(tree, refName || tree.hash)

        tx.onabort = reject
        tx.onerror = reject
        tx.oncomplete = () => resolve(tree)
      })
    }

    getTree(hash: string): Promise<Treelike> {
      return new Promise((resolve, reject) => {
        const tx = this.db?.transaction(['trees'], 'readonly')
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

    purgeBy(purgeFn: PurgeFn) {
      return new Promise((resolve, reject) => {
        const tx = this.db?.transaction(['trees'], 'readwrite')
        if (!tx) {
          return reject(new Error(`Failed to create a database transaction`))
        }
        const store = tx.objectStore('trees')
        const req = store.openCursor()
        req.onsuccess = () => {
          let cursor: IDBCursorWithValue | null = req.result
          if (!cursor) {
            return resolve(null)
          } else if (purgeFn(cursor.value.hash)) {
            cursor.delete()
          }
          cursor.continue()
        }
        req.onerror = (err) => {
          reject(new Error(`Failed to read: ${err}`))
        }
      })
    }
  }

  const treeDb = new TreeDatabase()

  /**
   * REST API logic
   */
  class ClientError extends Error {
    res: Response

    constructor(message, res) {
      super(message)
      this.res = res
    }
  }

  async function _fetchTree(hash): Promise<Treelike> {
    return fetch(`${baseUrl}/api/database/tree/${hash}.json`)
      .then(res => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`Failed to fetch tree ${hash}`)
        }
        return res.json()
    })
  }

  function fetchTree(hash: string) {
    return fetchExecutor.queue(() => _fetchTree(hash))
  }

  /**
   * Tree logic
   */
  async function loadTreeEntries(root: Treelike, seenHashes: Set<String>, onEntry: (entry) => void) {
    const tasks: any[] = []
    for (let child of root.data) {
      if (child.type == 'entry' && child.data) {
        onEntry(child.data)
      }
      if (child.type == 'tree') {
        if (seenHashes.has(child.hash)) {
          continue
        }
        seenHashes.add(child.hash)
        const task = treeDb.getTree(child.hash)
          .catch(async () => {
            const tree = await fetchTree(child.hash)
            await treeDb.addTree(tree)
            return tree
          })
          .then(tree => loadTreeEntries(tree, seenHashes, onEntry))
        tasks.push(task)
      }
    }

    return Promise.all(tasks)
  }

  async function walkTree(hash: string, treeVisitor: TreeVisitor) {
    const tree = await treeDb.getTree(hash).catch(() => null)
    const visitTree = treeVisitor.beforeTree(hash, tree)
    if (!visitTree || !tree) {
      return
    }

    for (let child of tree.data) {
      if (child.type == 'entry' && child.data && treeVisitor.onEntry) {
        treeVisitor.onEntry(child.data)
      }
      if (child.type == 'tree') {
        await walkTree(child.hash, treeVisitor)
      }
    }
  }

  async function purge(root: Treelike) {
    const hashes: string[] = []

    await walkTree(root.hash, {
      beforeTree(hash, tree) {
        if (!tree) {
          return false
        }
        hashes.push(hash)
        return true
      },
      onEntry() {}
    })

    if (!hashes.length) {
      return
    }

    console.log(`Purging ${hashes.length} outdated offline trees`)
    await treeDb.purgeBy(hash => !hashes.includes(hash))
  }

  async function findRemovedEntries(orig: Treelike, revised: Treelike, onRemoveEntry: (entry: Entry) => void) {
    const revisedEntryIds = new Set()
    const revisedTreeIds = new Set()
    await walkTree(revised.hash, {
      beforeTree(_, tree) {
        if (!tree) {
          return false
        }
        revisedTreeIds.add(tree.hash)
        return true
      },
      onEntry(entry) {
        revisedEntryIds.add(entry.id);
      }
    })

    // collect removes from original
    await walkTree(orig.hash, {
      beforeTree(hash, tree) {
        if (!tree) {
          return false
        }
        // skip common trees
        return !revisedTreeIds.has(hash)
      },
      onEntry(entry) {
        if (revisedEntryIds.has(entry.id)) {
          return
        }
        onRemoveEntry(entry)
      }
    })
  }

  const createBulkEntries = (onEntries) => {
    const seenHashes = new Set()
    let entries: any[] = []

    function flush() {
      onEntries(entries)
      entries = []
    }

    return {
      onEntry(entry) {
        if (seenHashes.has(entry.hash)) {
          return
        }
        seenHashes.add(entry.hash)
        entries.push(entry)
        if (entries.length >= onEntriesSize) {
          flush()
        }
      },
      flush,
      get count() {
        return seenHashes.size
      }
    }
  }


  /**
   * Public API
   */
  return {
    // methods
    open() {
      return treeDb.open()
    },
    async sync() {
      const tasks: any[] = []
      const bulkEntries = createBulkEntries(entries => this.onEntries(entries))
      const seenHashes = new Set<string>()

      // load offline root if exists
      const dbRoot = await treeDb.getTree('root').catch(() => null)
      if (dbRoot) {
        console.log(`Loading entries from offline database`)
        tasks.push(loadTreeEntries(dbRoot, seenHashes, bulkEntries.onEntry).then(() => {
          bulkEntries.flush()
          console.log(`All ${bulkEntries.count} entries loaded from offline database`)
        }))
      }

      // check current root and load it if changed
      const root = await fetchTree('root').catch(err => {
        if (err instanceof ClientError && err.res.status == 404) {
          // ignore 404 - database is not loaded yet
          return undefined
        }
        throw err
      })
      const inSync = root && dbRoot?.hash == root.hash
      if (inSync) {
        console.log(`Offline database is in sync with server database`)
      }
      if (root && !inSync) {
        console.log(`Loading entries from server for offline database`)
        tasks.push(loadTreeEntries(root, seenHashes, bulkEntries.onEntry).then(() => {
          bulkEntries.flush()
          console.log(`All ${bulkEntries.count} entries loaded from server`)
        }))
        tasks.push(treeDb.addTree(root), treeDb.addTree(root, 'root'))
      }
      await Promise.all(tasks)

      // diff old and new root to find entries to remove
      if (dbRoot && root && dbRoot.hash != root.hash) {
        console.log(`Sync offline and updated server entries`)
        const bulkRemoveEntries = createBulkEntries(entries => this.onRemoveEntries(entries))
        await findRemovedEntries(dbRoot, root, bulkRemoveEntries.onEntry)
        bulkRemoveEntries.flush()
        console.log(`Removed ${bulkRemoveEntries.count} outdated entries`)
        await purge(root)
      }

    },
    // event handlers
    onEntries() {},
    onRemoveEntries() {}
  }
}