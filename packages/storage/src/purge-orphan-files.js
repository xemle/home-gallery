const fs = require('fs').promises;
const path = require('path');

const log = require('@home-gallery/logger')('storage.purge');

const { readJsonGzip, promisify, humanize } = require('@home-gallery/common');

const { getEntryFilesCacheId } = require('./entry-files-cache-file')

const asyncReadJsonGzip = promisify(readJsonGzip)

const getFiles = (database) => {
  return database.data.reduce((result, entry) => {
    result.push(...entry.files)
    return result
  }, [])
}

const getValidIdMapFromDatabase = (database) => {
  const files = getFiles(database)
  const fileIds = files.reduce((result, file) => {
    result[file.id] = true
    return result
  }, {})
  const cacheIds = files.reduce((result, file) => {
    const cacheId = getEntryFilesCacheId({indexName: file.index, ...file})
    result[cacheId] = true
    return result
  }, {})

  return {...fileIds, ...cacheIds}
}

const getValidIdMapFromIndex = (index) => {
  const fileIds = index.data.filter(file => file.sha1sum).reduce((result, file) => {
    result[file.sha1sum] = true
    return result
  }, {})

  return fileIds
}

const getAllValidIdMap = async (databaseFilename, indexFilenames) => {
  let t0 = Date.now()
  log.debug(`Reading database from ${databaseFilename}`)
  const database = await asyncReadJsonGzip(databaseFilename)
  log.info(t0, `Read database from ${databaseFilename} with ${database.data.length} entries`)

  t0 = Date.now()
  let validIdMap = getValidIdMapFromDatabase(database)
  log.debug(t0, `Found ${Object.keys(validIdMap).length} valid storage ids from ${database.data.length} entries`)

  if (!indexFilenames.length) {
    return validIdMap
  }

  for (const indexFilename of indexFilenames) {
    let t0 = Date.now()
    log.debug(`Reading file index from ${indexFilename}`)
    const index = await asyncReadJsonGzip(indexFilename)
    log.info(t0, `Read file index from ${indexFilename} with ${index.data.length} index entries`)

    t0 = Date.now()
    const indexValidIdMap = getValidIdMapFromIndex(index)
    validIdMap = {...validIdMap, ...indexValidIdMap}
    log.debug(t0, `Found ${Object.keys(indexValidIdMap).length} valid storage ids from ${index.data.length} index entries`)
  }

  log.debug(t0, `Found ${Object.keys(validIdMap).length} valid storage ids in total`)
  return validIdMap
}

const walk = async (base, dir, options, depth = 0) => {
  log.trace(`Reading directory ${path.resolve(base, dir)}`)
  let files = await fs.readdir(path.resolve(base, dir))

  files.sort()

  if (typeof options.onFileFilter == 'function') {
    files = await options.onFileFilter(base, dir, files, depth)
  }

  for (const file of files) {
    const stat = await fs.stat(path.resolve(base, dir, file))
    const filePath = path.join(dir, file)
    if (stat.isDirectory()) {
      if (options.maxDepth && depth >= options.maxDepth) {
        log.debug(`Skip directory. Max depth of ${options.maxDepth} exceeded`)
      } else {
        await walk(base, filePath, options, depth + 1).catch(err => log.error(err, `Could not walk directory ${filePath}: ${err}`))
      }
    } else if (stat.isFile() && typeof options.onFile == 'function') {
      await options.onFile(base, dir, file, stat, depth + 1).catch(err => log.error(err, `Could process file ${filePath}: ${err}`))
    }
  }
}

const createDirFilter = (stats) => {
  return async (base, dir, files, depth) => {
    if (depth == 0) {
      stats.level0TotalDirs = files.length
    } else if (depth == 1) {
      stats.level0Dirs++
    }
    stats.directories++
    return files
  }
}

const createRemoveFile = (validIdMap, stats, options) => {
  const unlinkFn = options.dryRun ? () => Promise.resolve(true) : fs.unlink
  let lastLog = Date.now()

  return async (base, dir, file, fileStat, depth) => {
    if (depth != 3) {
      return
    }
    stats.files++
    stats.fileSize += fileStat.size
    const idPrefix = dir.replace(/[\\/]/g, '')

    const now = Date.now()
    if (now - lastLog > 10 * 1000) {
      log.info(lastLog, `Processed ${stats.files} files and removed ${stats.removedFiles} orphan files (${humanize(stats.removedFileSize)}) at ~${(100 * stats.level0Dirs / stats.level0TotalDirs).toFixed(1)}% of storage${options.dryRunSuffix}`)
      lastLog = now
    }

    if (!file.match(/^[a-z0-9]{36}-.*/)) {
      return
    }
    const id = idPrefix + file.substring(0, 36)
    if (validIdMap[id]) {
      return
    }

    await unlinkFn(path.resolve(base, dir, file))
      .then(() => {
        stats.removedFiles++
        stats.removedFileSize += fileStat.size
        log.debug(`Removed orphan file ${path.join(dir, file)} with ${humanize(fileStat.size)}${options.dryRunSuffix}`)
      })
      .catch(err => log.warn(err, `Could not remove orphan file ${path.join(dir, file)}: ${err}`))
  }
}

const purgeOrphanFiles = async (storageDir, databaseFilename, indexFilenames, options) => {
  options.dryRunSuffix = options.dryRun ? ' (dry-run)' : ''
  log.info(`Removing orphan files in storage directory ${storageDir}${options.dryRunSuffix}`)

  const validIdMap = await getAllValidIdMap(databaseFilename, indexFilenames)

  const stats = {
    level0TotalDirs: 0,
    level0Dirs: 0,
    directories: 0,
    files: 0,
    fileSize: 0,
    removedFiles: 0,
    removedFileSize: 0
  }

  let t0 = Date.now()
  log.debug(`Walking storage diretory in ${storageDir}`)
  await walk(storageDir, '', {
    onFileFilter: createDirFilter(stats),
    onFile: createRemoveFile(validIdMap, stats, options),
    maxDepth: 2
  })
  log.info(t0, `Checked ${stats.directories} directories and ${stats.files} files (${humanize(stats.fileSize)}). Removed ${stats.removedFiles} orphan files (${humanize(stats.removedFileSize)})${options.dryRunSuffix}`)
}

module.exports = {
  purgeOrphanFiles
}