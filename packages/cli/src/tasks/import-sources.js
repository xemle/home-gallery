const chokidar = require('chokidar')
const { runCli, loggerArgs } = require('./run')

const log = require('@home-gallery/logger')('cli.task.import')

const updateIndex = async (config, source, options) => {
  const { initialImport, journal, smallFiles } = options
  const args = [...loggerArgs(config), 'index', '--directory', source.dir, '--index', source.index]
  source.matcher && args.push('--matcher', source.matcher)
  source.excludeFromFile && args.push('--exclude-from-file', source.excludeFromFile)
  source.excludeIfPresent && args.push('--exclude-if-present', source.excludeIfPresent)

  const excludes = source.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  if (source.maxFilesize || smallFiles) {
    args.push('--max-filesize', source.maxFilesize || '20M')
  }
  initialImport && args.push('--add-limits', '200,500,1.25,8000')
  journal && args.push('--journal', journal)
  await runCli(args)
}

const updateIndices = async (config, sources, options) => {
  for (const source of sources) {
    await updateIndex(config, source, options);
  }
}

const deleteJournal = async (config, source, journal) => {
  const args = [...loggerArgs(config), 'index', 'journal', '--index', source.index, '--journal', journal, '-r']
  await runCli(args)
}

const deleteJournals = async (config, sources, journal) => {
  if (!journal) {
    return
  }
  for (const source of sources) {
    await deleteJournal(config, source, journal);
  }
}

const extract = async (config, sources, options) => {
  if (!sources.length) {
    log.warn(`Sources list is empty. No files to extract`);
    return;
  }
  const args = [...loggerArgs(config), 'extract'];
  const extractor = config.extractor || {};
  sources.forEach(source => args.push('--index', source.index));

  args.push('--storage', config.storage.dir)

  if (extractor.apiServer) {
    // for version <= v1.4.1 apiServer was a string for api server url
    const apiServer = typeof extractor.apiServer == 'object' ? extractor.apiServer : { url: `${extractor.apiServer}` }
    apiServer.url && args.push('--api-server', apiServer.url)
    apiServer.timeout && args.push('--api-server-timeout', apiServer.timeout)
    apiServer.concurrent && args.push('--api-server-concurrent', apiServer.concurrent)
  }

  extractor.geoAddressLanguage && ['--geo-address-language'].concat(extractor.geoAddressLanguage).forEach(v => args.push(v))

  const excludes = extractor.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  if (Array.isArray(extractor.useNative)) {
    args.push('--use-native', ...extractor.useNative)
  }

  options.checksumFrom && args.push('--checksum-from', options.checksumFrom)
  options.journal && args.push('--journal', options.journal)
  if (options.concurrent) {
    args.push('--concurrent', options.concurrent)
    args.push('--skip', options.skip || 0)
    args.push('--limit', options.limit || 0)
  }

  await runCli(args)
}

const buildDatabase = async (config, sources, options) => {
  const args = [...loggerArgs(config), 'database'];

  sources.forEach(source => args.push('--index', source.index));
  if (options.journal) {
    args.push('--journal', options.journal)
  }

  const storage = config.storage || {}
  args.push('--storage', storage.dir, '--database', config.database.file);
  const excludes = storage.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  const maxMemory = config.database?.maxMemory || 2048;
  const nodeArgs = maxMemory ? [`--max-old-space-size=${maxMemory}`] : [];
  await runCli(args, {}, nodeArgs);
}

const catchIndexLimitExceeded = exitCode => {
  if (exitCode == 1) {
    return true
  }
  throw new Error(`Exit code was ${exitCode}`)
}

const generateId = len => {
  let id = '';
  while (id.length < len) {
    const c = String.fromCharCode(+(Math.random()*255).toFixed())
    if (c.match(/[0-9A-Za-z]/)) {
      id += c
    }
  }
  return id
}

const pad = (s, c, l) => {
  s = `${s}`
  while (s.length < l) {
    s = c + s
  }
  return s
}

const generateJournal = () => {
  const now = new Date();
  return `${pad(now.getUTCMonth() + 1, '0', 2)}${pad(now.getUTCDate(), '0', 2)}-${generateId(4)}`
}

const requireJournal = (initialImport, incrementalUpdate) => initialImport || incrementalUpdate

const importSources = async (config, sources, options) => {
  let processing = true
  const { initialImport, incrementalUpdate, smallFiles } = options
  while (processing) {
    const journal = requireJournal(initialImport, incrementalUpdate) ? generateJournal() : false

    await updateIndices(config, sources, { initialImport, journal, smallFiles }).then(() => processing = false).catch(catchIndexLimitExceeded)
    await extract(config, sources, { journal })
    await buildDatabase(config, sources, { journal })
    await deleteJournals(config, sources, journal)

    if (processing) {
      log.info(`New chunk of media is processed and is ready to browse. Continue with next chunk to process...`)
    }
  }
}

const watchSources = async (config, sources, options) => {
  const { watch, watchDelay, watchMaxDelay, watchPollInterval, importOnWatchStart } = options
  if (!watch) {
    return batchImport(config, sources, options)
  }

  let isImporting = false
  let isInitializing = true
  let fileChangeCount = 0
  const sourceDirs = sources.map(source => source.dir)

  log.debug(`Start watching dirs for file changes: ${sourceDirs.join(', ')}`)
  const usePolling = watchPollInterval > 0
  const chokidarOptions = {
    followSymlinks: false,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    usePolling,
    interval: usePolling ? watchPollInterval * 1000 : 100,
    binaryInterval: usePolling ? watchPollInterval * 1000 : 300
  }
  log.trace({chokidarOptions}, `Use chokidar as file watcher ${usePolling ? 'with polling' : 'with fs events'}`)
  let watcher = chokidar.watch(sourceDirs, chokidarOptions)

  const runImport = async () => {
    if (isImporting) {
      return
    }
    isImporting = true
    fileChangeCount = 0
    log.info(`Import from online sources: ${sourceDirs.join(', ')}`)
    return importSources(config, sources, options)
      .then(() => {
        isImporting = false
        if (fileChangeCount > 0) {
          log.info(`Re-run import due ${fileChangeCount} queued file changes`)
          return runImport()
        }
      })
  }

  const createChangeDelay = (delay, maxDelay, onChange) => {
    let firstChangeMs
    let timerId

    const clearTimer = () => clearTimeout(timerId)
    process.once('SIGINT', clearTimer)
    process.once('SIGTERM', clearTimer)

    return (event, path) => {
      if (fileChangeCount == 0) {
        firstChangeMs = Date.now()
      }
      fileChangeCount++
      const importDelay = Math.min(Math.max(0, firstChangeMs + maxDelay - Date.now()), delay)
      log.trace(`File change detected: ${event} at ${path}. Delay import by ${importDelay}ms`)
      clearTimer()
      timerId = setTimeout(() => {
        if (!fileChangeCount) {
          return
        } else if (!isImporting) {
          onChange()
        } else {
          log.debug(`Queue file change due running import`)
        }
      }, importDelay)
    }
  }

  return new Promise((resolve, reject) => {
    const importErrorHandler = err => {
      isImporting = false
      log.error(err, `Failed to import: ${err}`);
      log.info(`Stop watching files due error`)
      return watcher.close().then(() => reject(err))
    }

    const onReady = () => {
      isInitializing = false
      log.debug(`File watcher initialized`)
      if (importOnWatchStart) {
        runImport().catch(importErrorHandler)
      }
    }

    const onDelayChange = () => {
      log.debug(`Run import due ${fileChangeCount} file changes`)
      runImport().catch(importErrorHandler)
    }

    const createFallbackWatcher = () => {
      const pollingOptions = {...chokidarOptions,
        usePolling: true,
        interval: 5 * 60 * 1000,
        binaryInterval: 5 * 60 * 1000
      }

      log.trace({chokidarOptions: pollingOptions}, `Use chokidar as file watcher with fallback polling`)
      watcher = chokidar.watch(sourceDirs, pollingOptions)

      watcher.on('ready', onReady)
      watcher.on('all', createChangeDelay(30 * 1000, 30 * 1000, onDelayChange))
      watcher.on('error', onError)
    }

    const onError = err => {
      watcher.close().then(() => {
        fileChangeCount = 0
        if (err.code == 'ENOSPC' && !usePolling) {
          log.warn(err, `System limit for file watcher exceeded. Increase limit or use polling mode to fix it. Fallback to file watcher with poll interval of 5 min`)
          createFallbackWatcher()
        } else {
          log.error(err, `Stop watcher due watch error ${err}`)
          reject(err)
        }
      })
    }

    watcher.on('ready', onReady)
    watcher.on('all', createChangeDelay(watchDelay, watchMaxDelay, onDelayChange))
    watcher.on('error', onError)

    const shutdown = (signal) => {
      log.info(`Stop watcher due ${signal} signal`)
      watcher.close().then(() => {
        fileChangeCount = 0
        resolve()
      })
    }

    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))

    process.on('SIGUSR1', () => log.info(`File watcher status: ${isInitializing ? 'initializing' : (isImporting ? 'importing' : 'idle')}`))
  })
}

module.exports = {
  importSources,
  watchSources,
  extract,
  buildDatabase
}
