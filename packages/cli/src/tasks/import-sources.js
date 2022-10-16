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

  if (options.journal) {
    sources.forEach(source => args.push('--index', source.index));
    args.push('--journal', options.journal)
  } else {
    config.sources.forEach(source => args.push('--index', source.index));
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

const importSources = async (config, sources, initialImport, incrementalUpdate, smallFiles) => {
  let processing = true;
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

module.exports = { importSources, extract, buildDatabase }
