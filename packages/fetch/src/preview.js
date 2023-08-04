const fs = require('fs')
const path = require('path')
const { Readable, pipeline } = require('stream')

const log = require('@home-gallery/logger')('fetch.preview')
const { parallel, purge } = require('@home-gallery/stream')

const { fetchFile } = require('./api')

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

const downloadPreviewFiles = async (serverUrl, previewFiles, storageDir, insecure, forceDownload) => {
  if (!previewFiles.length) {
    log.info(`No missing files to download`)
    return
  }

  let fetchFileCount = 0

  const test = (file, cb) => {
    if (forceDownload) {
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

  const task = (file, cb) => fetchFile(serverUrl, file, storageDir, { insecure })
    .then(() => {
      fetchFileCount++
      cb()
    })
    .catch(err => {
      log.error(err, `Could not fetch ${file} from remote: ${err}`)
      cb(err)
    })

  log.info(`Fetching ${previewFiles.length} files from ${serverUrl}${forceDownload ? ' (forced)' : ''}`)
  const t0 = Date.now()
  return new Promise((resolve, reject) => {
    pipeline(
      Readable.from(previewFiles),
      parallel({ test, task, concurrent: 10 }),
      purge(),
      err => err ? reject(err) : resolve()
    )
  }).then(() => {
    log.info(t0, `Fetched ${fetchFileCount} files from ${serverUrl}`)
  })
}

const handlePreviews = async (serverUrl, remoteDatabase, localDatabase, storageDir, options) => {
  const { insecure, downloadAll, forceDownload } = options
  const previewFiles = getPreviewFiles(remoteDatabase, localDatabase, downloadAll)
  await downloadPreviewFiles(serverUrl, previewFiles, storageDir, insecure, forceDownload)
}

module.exports = {
  handlePreviews
}