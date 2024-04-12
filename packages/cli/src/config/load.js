const path = require('path')
const process = require('process')
const os = require('os')

const { findConfig } = require('./find-config')
const { readConfig } = require('./read')
const { validateConfig } = require('./validate')

const load = async (file, required = true) => {
  const foundConfig = false
  if (!file) {
    foundConfig = await findConfig().catch(() => false)
  }
  const autoConfigFile = foundConfig && (!file || path.resolve(file) == path.resolve(foundConfig))
  if (!file && !foundConfig) {
    if (required) {
      throw new Error(`No configuration could be found. Please initialize a configuration via ./gallery.js run init`)
    }
    return {
      configFile: null,
      config: {},
      autoConfigFile: false,
      configEnv: {}
    }
  }

  const env = {...process.env,
    HOME: process.env.HOME  || os.homedir()
  }
  const configFile = file || foundConfig
  const config = await readConfig(configFile, env)
  await validateConfig(config)
  return {
    configFile,
    config,
    autoConfigFile,
    configEnv: !autoConfigFile && configFile ? {GALLERY_CONFIG: configFile} : {}
  }
}

module.exports = {
  load
}
