const fs = require('fs/promises')
const path = require('path')

const addSources = async (data, sources) => {
  if (!sources || !sources.length) {
    return data
  }
  const lines = data.split('\n')
  const sourcesIndex = lines.indexOf('sources:')
  if (sourcesIndex < 0) {
    console.log(`Could not find sources marker to add ${sources.length} sources`)
    return data
  }

  lines.splice(sourcesIndex + 1, 1, ...sources.map(source => `  - dir: '${source}'`))
  console.log(`Set sources directories: ${sources.map(s => `'${s}'`).join(', ')}`)
  return lines.join('\n')
}

const initConfig = async (options, origErr) => {
  const target = options.configFile
  const fallback = options.configFallback

  if (!target.match(/\.ya?ml$/i)) {
    throw new Error(`Unsupported file extension for configuration initialization. Expecting a .yaml or .yml file: ${target}`)
  }

  const exists = await fs.access(fallback).then(() => true).catch(() => false)
  if (!exists) {
    const msg = `Could not read initial configuration file '${fallback}' for initialization`
    console.log(msg)
    throw origErr ? origErr : new Error(msg)
  }

  return fs.mkdir(path.dirname(target), {recursive: true})
    .then(() => fs.readFile(fallback, 'utf-8'))
    .then(data => addSources(data, options.sources))
    .then(data => fs.writeFile(target, data, 'utf8').then(() => data))
    .then(data => {
      console.log(`Initialized configuration '${target}' from ${fallback}`)
      return data
    })
    .catch(err => {
      console.log(`Failed to initialize configuration '${target}' from ${fallback}: ${err}`)
      throw err;
    })
}

module.exports = { initConfig }
