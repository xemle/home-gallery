const fs = require('fs/promises')
const path = require('path')
const { Readable, pipeline } = require('stream')

const log = require('@home-gallery/logger')('fetch.preview')
const { parallel, purge } = require('@home-gallery/stream')

const { fetchFile } = require('./api')

const getMissingFiles = (remoteDatabase, localDatabase) => {
  const t0 = Date.now()
  log.trace(`Collecting local preview files`)
  const localFileMap = localDatabase.data.reduce((fileMap, entry) => {
    (entry.previews || []).forEach(file => fileMap[file] = true)
    return fileMap
  }, {})

  log.trace(`Collecting missing remote preview files`)
  const missingRemoteFiles = remoteDatabase.data.reduce((files, entry) => {
    (entry.previews || []).forEach(file => {
      if (!localFileMap[file]) {
        files.push(file)
      }
    })
    return files
  }, [])

  log.debug(t0, `Found ${missingRemoteFiles.length} missing remote preview files`)
  return missingRemoteFiles
}

const downloadMissingFiles = async (serverUrl, missingFiles, storageDir, { insecure }) => {
  if (!missingFiles.length) {
    log.info(`No missing files to download`)
    return
  }

  const test = (file, cb) => fs.access(path.join(storageDir, file))
    .then(() => {
      log.trace(`Skip downloading existing file ${file}`)
      cb(false)
    })
    .catch(() => cb(true))

  const task = (file, cb) => fetchFile(serverUrl, file, storageDir, { insecure }).then(() => cb()).catch(err => cb(err))

  log.info(`Fetch ${missingFiles.length} files from ${serverUrl}`)
  const t0 = Date.now()
  return new Promise((resolve, reject) => {
    pipeline(
      Readable.from(missingFiles),
      parallel({ test, task, concurrent: 10 }),
      purge(),
      err => err ? reject(err) : resolve()
    )
  }).then(() => {
    log.info(t0, `Fetched ${missingFiles.length} files from ${serverUrl}`)
  })
}

const handlePreviews = async (serverUrl, remoteDatabase, localDatabase, storageDir, { insecure }) => {
  const missingFiles = getMissingFiles(remoteDatabase, localDatabase)
  await downloadMissingFiles(serverUrl, missingFiles, storageDir, { insecure })
}

module.exports = {
  handlePreviews
}