import { access } from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'

import Logger from '@home-gallery/logger'
import { createOrEmptyReadableStream } from '@home-gallery/database';
import { createWriteStream } from '@home-gallery/database';
import { each, filter, through } from '@home-gallery/stream';
import { filterEntriesByQuery, createStringifyEntryCache } from '@home-gallery/query'

import { fetchFile } from './api.js';

const log = Logger('fetch.database')

export const filterDatabaseByQuery = async (database, query) => {
  if (!query) {
    log.debug(`No query is given, skip query filtering`)
    return database
  }

  const t1 = Date.now()
  const stringifyEntryCache = createStringifyEntryCache()
  return filterEntriesByQuery(database.data, query, {textFn: stringifyEntryCache.stringifyEntry})
    .then(({entries}) => {
      const filteredDatabase = Object.assign({}, database, {data: entries})
      log.info(t1, `Filtered database with ${database.data.length} entries by query '${query}' to ${filteredDatabase.data.length} entries`)
      return filteredDatabase
    })
    .catch(err => {
      log.error(err, `Could not fitler ${database.data.length} database entries with query ${query}`)
      return Promise.reject(err)
    })
}

/**
 * @param {string} databaseFilename
 * @param {import('./types').RemoteDatabase} remoteDatabase
 * @param {string} storageDir
 * @param {import('./types').Remote} remote
 */
export const mergeRemoteDatabase = async (databaseFilename, remoteDatabase, storageDir, remote) => {
  const readable = await createOrEmptyReadableStream(databaseFilename)
  const removableStream = createRemovableStream(remoteDatabase.data, remote.deleteLocal)
  const insertStream = createInsertStream(remoteDatabase.data)
  const downloadAllStream = createDownloadAllStream(remoteDatabase, storageDir, remote)
  const writeable = await createWriteStream(databaseFilename)

  const t0 = Date.now()
  let origCount = 0
  let count = 0
  await pipeline(
    readable,
    each(() => origCount++),
    removableStream,
    insertStream,
    downloadAllStream,
    each(() => count++),
    writeable
  )

  const diff = count - origCount
  const sign = diff > 0 ? '+' : ''
  log.info(t0, `Updated database with ${origCount} entries to ${count} entries in total (${sign}${diff})`)
  return count
}

const createRemovableStream = (entries, deleteLocal) => {
  if (deleteLocal) {
    const indices = getEntryIndices(entries)
    return createRemoveAllEntriesByIndices(indices)
  } else {
    return createReplaceStream(entries)
  }
}

/**
 * @param {object} entries
 * @returns {string[]} Indices
 */
const getEntryIndices = (entries) => {
  const indices = entries.reduce((result, entry) => {
    const firstFile = entry.files[0]
    const index = firstFile.index
    if (!result.includes(index)) {
      result.push(index)
    }
    return result
  }, [])

  return indices
}

/**
 * @param {string[]} indices
 * @returns {import('stream').Transform}
 */
const createRemoveAllEntriesByIndices = (indices) => {
  return filter(entry => {
    const firstFile = entry.files[0]
    if (!indices.includes(firstFile.index)) {
      return true
    }

    return false
  })
}

const createReplaceStream = (entries) => {
  const entryFileMap = entries.reduce((result, entry) => {
    entry.files.forEach(({index, filename}) => {
      if (!result[index]) {
        result[index] = {}
      }
      result[index][filename] = true
      return result
    })
    return result
  }, {})

  return filter(entry => {
    const firstFile = entry.files[0]
    const filesMap = entryFileMap[firstFile.index]
    if (!filesMap) {
      return true
    }

    const hasAnyEntryFile = entry.files.find(file => filesMap[file.filename])
    return !hasAnyEntryFile
  })
}

const createInsertStream = (entries) => {
  entries.sort((a, b) => a.date > b.date ? -1 : 0)

  let insertIndex = 0

  const insert = (ctx, date, cb) => {
    while (insertIndex < entries.length && entries[insertIndex].date > date) {
      ctx.push(entries[insertIndex++])
    }

    cb()
  }

  return through(function(entry, enc, cb) {
    insert(this, entry.date, () => {
      cb(null, entry)
    })
  }, function(cb) {
    insert(this, '0000', cb)
  })
}

/**
 * @param {import('./types').RemoteDatabase} remoteDatabase
 * @param {string} storageDir
 * @param {import('./types').Remote} remote
 */
const createDownloadAllStream = (remoteDatabase, storageDir, remote) => {
  if (!remote.downloadAll) {
    return through((entry, enc, cb) => cb(null, entry))
  }

  const indices = getEntryIndices(remoteDatabase.data)
  const entryIds = remoteDatabase.data.map(entry => entry.id)

  const downloadPreviews = async (entry) => {
    await Promise.allSettled(entry.previews.map(preview => {
      if (remote.forceDownload) {
        return fetchFile(remote, preview, storageDir)
      }
      const localFile = path.resolve(storageDir, preview)
      return access(localFile).catch(() => {
        return fetchFile(remote, preview, storageDir)
      })
    }))
  }

  return through(function(entry, enc, cb) {
    const firstFile = entry.files[0]
    if (!indices.includes(firstFile.index) || entryIds.includes(entry.id)) {
      return cb(null, entry)
    }

    downloadPreviews(entry).finally(() => cb(null, entry))
  })
}