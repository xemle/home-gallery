const fs = require('fs/promises')
const path = require('path')

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
    .then(() => fs.copyFile(fallback, target))
    .then(() => fs.readFile(target, 'utf8'))
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
