import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import Logger from '@home-gallery/logger'

const log = Logger('fetch.preview')
import { parallel, purge } from '@home-gallery/stream'

import { fetchFile } from './api.js'

const getPreviewFiles = (remoteDatabase, localDatabase, downloadAll) => {
  const t0 = Date.now()
  const localFileMap = {}
  if (!downloadAll) {
    log.trace(`Collecting local files`)
    localDatabase.data.reduce((fileMap, entry) => {
      (entry.previews || []).forEach(file => fileMap[file] = true)
      return fileMap
    }, localFileMap)
    log.debug(t0, `Found ${Object.keys(localFileMap).length} local files`)
  }

  log.trace(`Collecting remote files`)
  const remoteFiles = remoteDatabase.data.reduce((files, entry) => {
    const previews = (entry.previews || []).filter(file => !localFileMap[file])
    files.push(...previews)
    return files
  }, [])

  log.debug(t0, `Found ${remoteFiles.length} remote files for download`)
  return remoteFiles
}

/**
 * @param {import('./types').Remote} remote
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
 */
export const handlePreviews = async (remote, remoteDatabase, localDatabase, storageDir) => {
  const previewFiles = getPreviewFiles(remoteDatabase, localDatabase, remote.downloadAll)
  await downloadPreviewFiles(remote, previewFiles, storageDir)
}
