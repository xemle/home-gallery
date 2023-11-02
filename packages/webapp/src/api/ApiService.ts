
import { v4 as uuidv4 } from 'uuid';
import { Event, EventAction } from '@home-gallery/events'
import { pushEvent as pushEventApi, eventStream as eventStreamApi, ServerEventListener, getTree, mapEntriesForBrowser } from './api';
import { UnsavedEventHandler } from './UnsavedEventHandler';
import { Tag } from './models';
import { Entry } from "../store/entry";
import { OfflineDatabase } from '../offline'
import { EventBus } from './EventBus';

export { fetchAll, getEvents, mapEntriesForBrowser } from './api'

const tagToAction = (tag: Tag): EventAction => {
  if (tag.remove) {
    return {action: 'removeTag', value: tag.name}
  } else {
    return {action: 'addTag', value: tag.name}
  }
}

export const addTags = async (entryIds: string[], tags: Tag[]) => {
  const actions = tags.map(tagToAction);
  const event: Event = {type: 'userAction', id: uuidv4(), targetIds: entryIds, actions };
  return pushEvent(event);
}

let eventStreamSubscribed = false;

const unsavedEventHandler = new UnsavedEventHandler();
export const eventBus = new EventBus()

export const pushEvent = async (event: Event) => {
  unsavedEventHandler.addEvent(event)
  eventBus.dispatch(event)
  return pushEventApi(event)
    .catch(e => {
      console.log(`Event ${event.id} could not be sent: ${e}. Event will be lost on the next session`);
      throw e;
    });
}

export const eventStream = () => {
  if (!eventStreamSubscribed) {
    eventStreamSubscribed = true;
    eventStreamApi(unsavedEventHandler.middleware(event => eventBus.dispatch(event)));
  }
}

const createOnEntriesDefer = (onEntries, defer = 500) => {
  const knownHashes = {}
  let newEntries: Entry[] = []
  let last = Date.now()

  return {
    onEntry(entry) {
      if (knownHashes[entry.hash]) {
        return
      }
      knownHashes[entry.hash] = true
      newEntries.push(entry)
      const now = Date.now()
      if (now - last > defer) {
        onEntries(newEntries)
        newEntries = []
        last = now
      }
    },
    flush() {
      onEntries(newEntries)
      newEntries = []
      last = Date.now()
  }
  }
}

export const syncOfflineDatabase = async (db: OfflineDatabase, onEntries) => {
  const t0 = Date.now()

  const onEntriesDefer = createOnEntriesDefer(onEntries)

  const fetchMissingTrees = async (hashes: string[], concurrentFetch = 4) => {
    const missingHashes = await db.getMissingTrees(hashes)
    if (missingHashes.length) {
      const trees = await Promise.all(missingHashes.splice(0, concurrentFetch).map(hash => getTree(hash)))
      db.updateTrees(trees)
      const treeHashes = trees.reduce((result, tree) => {
        result.push(...tree.data.filter(t => t.type == 'tree').map(t => t.hash))
        return result
      }, [])
      const entries = trees.reduce((result, tree) => {
        result.push(...tree.data.filter(t => t.type != 'tree').map(t => t.entry))
        return result
      }, [])
      entries.forEach(onEntriesDefer.onEntry)
      console.log(`Fetched ${treeHashes.length} trees and ${entries.length} entries for offline database`)
      return fetchMissingTrees([...missingHashes, ...treeHashes], concurrentFetch)
    }
  }

  const syncTrees = async (root) => {
    const t0 = Date.now()
    let treeCount: number = 0
    const missingHashes: string[] = []
    await db.walkTree(root.hash, {
      beforeTree(hash, tree) {
        treeCount++
        if (tree) {
          return true
        }

        missingHashes.push(hash)
        return false
      },
      onEntry(entry) {
        onEntriesDefer.onEntry(entry)
      }
    })
    onEntriesDefer.flush()
    console.log(`Found ${missingHashes.length} from ${treeCount} trees out of sync in ${Date.now() - t0}ms`)
    if (missingHashes.length) {
      console.log(`Fetching ${missingHashes.length} missing tree objects`)
      return fetchMissingTrees(missingHashes)
        .then(() => syncTrees(root))
    }
  }

  console.log(`Syncing database entries with offline database...`)
  const root = await getTree('root')
  return syncTrees(root)
    .then(() => db.setRoot(root))
    .then(() => {
      console.log(`Synced all entries with offline database in ${Date.now() - t0}ms`)
    })
}

export const purgeOfflineDatabase = async (db: OfflineDatabase) => {
  const purgeTrees = async (rootHash) => {
    const t0 = Date.now()
    const treeHashes: string[] = []
    const purgedTrees: string[] = []
    await db.walkTree(rootHash, {
      beforeTree(hash, tree) {
        treeHashes.push(hash)
        return tree ? true : false
      },
      onEntry() {
      }
    })
    await db.purge(hash => {
      if (treeHashes.includes(hash)) {
        return false
      }
      purgedTrees.push(hash)
      return true
    })
    console.log(`Purged ${purgedTrees.length} offline tree objects in ${Date.now() - t0}ms`)
  }

  return db.getTree('root')
    .then(root => purgeTrees(root.hash), err => {
      console.log(`Purge failed: ${err}`)
    })
}