const path = require('path')
const process = require('process')
const os = require('os')

const { findConfig } = require('./find-config')
const { readConfig } = require('./read')
const { validateConfig } = require('./validate')

const load = async (file, required = true) => {
  const configFile = await findConfig().catch(() => false)
  const autoConfigFile = configFile && (!file || path.resolve(file) == path.resolve(configFile))
  if (!file && !configFile) {
    if (required) {
      throw new Error(`No configuration could be found. Please initialize a configuration via ./gallery.js run init`)
    }
    return {
      configFile: null,
      config: {},
      autoConfigFile: false
    }
  }

  const env = {...process.env,
    HOME: process.env.HOME  || os.homedir()
  }
  const config = await readConfig(file || configFile, env)
  await validateConfig(config)
  return {
    configFile: file || configFile,
    config,
    autoConfigFile,
  }
}

module.exports = {
  load
}
