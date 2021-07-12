const { runCli } = require('./run')

const updateIndex = async (source, options) => {
  const { initialImport, journal } = options
  const args = ['index', '--directory', source.dir, '--index', source.index]
  source.matcher && args.push('--matcher', source.matcher)
  source.excludeFromFile && args.push('--exclude-from-file', source.excludeFromFile)
  source.excludeIfPresent && args.push('--exclude-if-present', source.excludeIfPresent)

  excludes = source.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  initialImport && args.push('--add-limits', '200,500,1.25,8000')
  journal && args.push('--journal', journal)
  await runCli(args, {env: {DEBUG: '*'}})
}

const updateIndices = async (sources, options) => {
  for (const source of sources) {
    await updateIndex(source, options);
  }
}

const deleteJournal = async (source, journal) => {
  const args = ['index', 'journal', '--index', source.index, '--journal', journal, '-r']
  await runCli(args, {env: {DEBUG: '*'}})
}

const deleteJournals = async (sources, journal) => {
  if (!journal) {
    return
  }
  for (const source of sources) {
    await deleteJournal(source, journal);
  }
}

const extract = async (config, sources, options) => {
  if (!sources.length) {
    console.log(`Warn: Sources list is empty. No files to extract`);
    return;
  }
  const args = ['extract'];
  const extractor = config.extractor || {};
  sources.forEach(source => args.push('--index', source.index));

  args.push('--storage', config.storage.dir)
  extractor.apiServer && args.push('--api-server', extractor.apiServer)
  extractor.geoAddressLanguage && ['--geo-address-language'].concat(extractor.geoAddressLanguage).forEach(v => args.push(v))

  const excludes = extractor.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  options.checksumFrom && args.push('--checksum-from', options.checksumFrom)
  options.journal && args.push('--journal', options.journal)
  if (options.concurrent) {
    args.push('--concurrent', options.concurrent)
    args.push('--skip', options.skip || 0)
    args.push('--limit', options.limit || 0)
  }

  await runCli(args, {env: {DEBUG: '*'}})
}

const buildDatabase = async (config, options) => {
  const args = ['database'];
  const storage = config.storage || {}
  config.sources.forEach(source => args.push('--index', source.index));
  args.push('--storage', storage.dir, '--database', config.database.file);

  const excludes = storage.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  options.journal && args.push('--journal', options.journal)
  await runCli(args, {env: {DEBUG: '*'}}, ['--max-old-space-size=4096'])
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

const importSources = async (config, sources, initialImport, incrementalUpdate) => {
  let processing = true;
  while (processing) {
    const journal = requireJournal(initialImport, incrementalUpdate) ? generateJournal() : false

    await updateIndices(sources, { initialImport, journal }).then(() => processing = false).catch(catchIndexLimitExceeded)
    await extract(config, sources, { journal })
    await buildDatabase(config, { journal })
    await deleteJournals(sources, journal)

    if (processing) {
      console.log(`New chunk of media is processed and is ready to browse. Continue with next chunk to process...`)
    }
  }
}

module.exports = { importSources, extract }
