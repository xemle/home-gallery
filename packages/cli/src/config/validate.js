const fs = require('fs/promises')

const log = require('@home-gallery/logger')('cli.config.validate')

const assertError = (message, ...args) => { throw new Error(message, ...args) };

const validateSources = async sources => {
  if (!sources || !sources.length) {
    log.warn(`Sources list is empty`)
    return
  }

  const onlineSources = sources.filter(source => !source.offline)
  for (const i in onlineSources) {
    const source = onlineSources[i];
    const dirStat = await fs.stat(source.dir).catch(() => false);
    dirStat || assertError(`Source directory '${source.dir}' does not exists and is required for an online source.`)
    dirStat.isDirectory() || assertError(`Source directory '${source.dir}' is not a directory`)
  }

  const offlineSources = sources.filter(source => source.offline)
  for (const i in offlineSources) {
    const source = offlineSources[i];
    const fileStat = await fs.stat(source.index).catch(() => false);
    fileStat || assertError(`Index file ${source.index} of offline source directory '${source.dir}' does not exists. Offline sources require an index file and you should process a source first before it can be marked offline`)
    fileStat.isFile() || assertError(`Index file ${source.index} of offline source directory '${source.dir}' is not a file`)
  }

  const uniqIndexFiles = sources.map(source => source.index).filter((v, i, a) => a.indexOf(v) === i);
  (uniqIndexFiles.length == sources.length) || assertError(`Source index files are not unique`);
}

const validateConfig = async config => {
  await validateSources(config.sources)
}

module.exports = { validateConfig }
