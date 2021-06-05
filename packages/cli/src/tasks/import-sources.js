const { runCli } = require('./run')

const updateIndex = async (source, initialImport) => {
  const args = ['index', '--directory', source.dir, '--index', source.index]
  source.matcher && args.push('--matcher', source.matcher)
  source.excludeFromFile && args.push('--exclude-from-file', source.excludeFromFile)
  source.excludeIfPresent && args.push('--exclude-if-present', source.excludeIfPresent)

  excludes = source.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  initialImport && args.push('--add-limits', '200,500,1.25,8000')
  await runCli(args, {env: {DEBUG: '*'}})
}

const updateIndices = async (sources, initialImport) => {
  for (const source of sources) {
    await updateIndex(source, initialImport);
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

  if (options.concurrent) {
    args.push('--concurrent', options.concurrent)
    args.push('--skip', options.skip || 0)
    args.push('--limit', options.limit || 0)
  }

  await runCli(args, {env: {DEBUG: '*'}})
}

const buildDatabase = async (config) => {
  const args = ['build'];
  const storage = config.storage || {}
  config.sources.forEach(source => args.push('--index', source.index));
  args.push('--storage', storage.dir, '--database', config.database.file);

  const excludes = storage.excludes || [];
  excludes.forEach(exclude => args.push('--exclude', exclude))

  await runCli(args, {env: {DEBUG: '*'}}, ['--max-old-space-size=4096'])
}

const catchIndexLimitExceeded = exitCode => {
  if (exitCode == 1) {
    return true
  }
  throw new Error(`Exit code was ${exitCode}`)
}

const importSources = async (config, sources, initialImport, incrementalUpdate) => {
  let processing = true;
  while (processing) {
    const now = new Date().toISOString().substring(0, 16);
    await updateIndices(sources, initialImport).then(() => processing = false).catch(catchIndexLimitExceeded);
    await extract(config, sources, {
      checksumFrom: initialImport || incrementalUpdate ? now : false
    });
    await buildDatabase(config);
    if (processing) {
      console.log(`New chunk of media is processed and is ready to browse. Continue with next chunk to process...`)
    }
  }
}

module.exports = { importSources, extract }
