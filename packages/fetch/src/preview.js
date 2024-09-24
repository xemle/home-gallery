import fs from 'fs'
import { access } from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import Logger from '@home-gallery/logger'
import { parallel, purge } from '@home-gallery/stream'

import { fetchFile } from './api.js'

const log = Logger('fetch.preview')

/**
 * @param {import('./types.js').RemoteDatabase} remoteDatabase
 * @returns {string[]}
 */
const getPreviewFiles = (remoteDatabase) => {
  const remoteFiles = remoteDatabase.data.reduce((files, entry) => {
    const previews = entry.previews || []
    files.push(...previews)
    return files
  }, [])

  return remoteFiles
}

/**
 * @param {string[]} previewFiles
 * @param {string} storageDir
 * @returns {Promise<string[]>}
 */
const collectMissingPreviewFiles = async (previewFiles, storageDir) => {
  const missingFiles = []

  const t0 = Date.now()
  for (let file of previewFiles) {
    const missing = await access(path.resolve(storageDir, file)).then(() => false, () => true)
    if (missing) {
      missingFiles.push(file)
    }
  }
  log.trace(t0, `Found ${missingFiles.length} missing from total ${previewFiles.length} remote preview files`)

  return missingFiles
}
/**
 * @param {import('./types.js').Remote} remote
 * @param {string[]} previewFiles
 * @param {string} storageDir
 */
const downloadPreviewFiles = async (remote, previewFiles, storageDir) => {
  if (!previewFiles.length) {
    log.info(`No missing files to download`)
    return
  }

  let fetchFileCount = 0

  const test = (file, cb) => {
    if (remote.forceDownload) {
      return cb(true)
    }
    fs.access(path.join(storageDir, file), (fs.constants || fs).F_OK, err => {
      if (err) {
        return cb(true)
      }
      log.trace(`Skip downloading existing file ${file}`)
      return cb(false)
    })
  }

  const task = (file, cb) => fetchFile(remote, file, storageDir)
    .then(() => {
      fetchFileCount++
      cb()
    })
    .catch(err => {
      log.error(err, `Could not fetch ${file} from remote: ${err}`)
      cb(err)
    })

  log.debug(`Fetching ${previewFiles.length} files from remote ${remote.url}${remote.forceDownload ? ' (forced)' : ''}`)
  const t0 = Date.now()
  await pipeline(
    Readable.from(previewFiles),
    parallel({ test, task, concurrent: 10 }),
    purge(),
  )
  log.info(t0, `Fetched ${fetchFileCount} files from remote ${remote.url}`)
}

/**
 * @param {import('./types.js').Remote} remote
 * @param {import('./types.js').RemoteDatabase} remoteDatabase
 * @param {string} storageDir
 */
export const handlePreviews = async (remote, remoteDatabase, storageDir) => {
  const previewFiles = getPreviewFiles(remoteDatabase, storageDir)
  let filesToDownload = previewFiles
  if (!remote.forceDownload) {
    filesToDownload = await collectMissingPreviewFiles(previewFiles, storageDir)
  }
  await downloadPreviewFiles(remote, filesToDownload, storageDir)
}
