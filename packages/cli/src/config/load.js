const fs = require('fs/promises')
const path = require('path')
const YAML = require('yaml')

const log = require('@home-gallery/logger')('cli.config.load')

const { expandConfigDefaults } = require('./expand')
const { resolveConfig } = require('./resolve')
const { validateConfig  } = require('./validate')
const { initConfig } = require('./init')

const loadConfig = async options => {
  const isYaml = options.configFile.match(/\.ya?ml$/i);
  const isJson = options.configFile.match(/\.json$/i);
  if (!isYaml && !isJson) {
    throw new Error(`Unknown file extension of '${options.configFile}'. Expect a .yaml or .json file`)
  }

  const data = await fs.readFile(options.configFile, 'utf8').catch(err => initConfig(options, err))
  const config = isYaml ? YAML.parse(data) : JSON.parse(data)
  const env = {...process.env, ...{
    HOME: process.env['HOME'] || process.env['HOMEPATH'],
    CWD: path.resolve(path.dirname(options.configFile))
  } }

  expandConfigDefaults(config, env)
  resolveConfig(config, env)
  await validateConfig(config)
    .catch(e => {
      console.error(`Check your expanded configuration file: ${e}`)
      console.log(`Check your expanded configuration file:`)
      console.log(YAML.stringify(config))
      throw e
    })
  log.debug(`Loaded gallery configuration from ${options.configFile}`)
  options.config = config;
  return options;
}

module.exports = { loadConfig }
