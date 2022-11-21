const process = require('process')
const os = require('os')

const { findConfig } = require('./find-config')
const { readConfig } = require('./read')
const { validateConfig } = require('./validate')

const load = async (file, required = true) => {
  let configFile
  let autoConfigFile = !file
  if (file) {
    configFile = file
  } else {
    configFile = await findConfig().catch(() => false)
    if (configFile == false) {
      if (required) {
        throw new Error(`No configuration could be found. Please initialize a configuration via ./gallery.js run init`)
      }
      return {
        configFile: file || null,
        config: {},
        autoConfigFile
      }
    }
  }

  const env = {...process.env,
    HOME: process.env.HOME  || os.homedir()
  }
  const config = await readConfig(configFile, env)
  await validateConfig(config)
  return {
    configFile,
    config,
    autoConfigFile,
  }
}

module.exports = {
  load
}
