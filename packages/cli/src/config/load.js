const fs = require('fs/promises')
const path = require('path')
const YAML = require('yaml')

const { expandConfigDefaults } = require('./expand')
const { resolveConfig } = require('./resolve')
const { validateConfig  } = require('./validate')
const { initExampleConfig } = require('./init')

const loadConfig = async options => {
  const isYaml = options.configFile.match(/\.ya?ml$/i);
  const isJson = options.configFile.match(/\.json$/i);
  if (!isYaml && !isJson) {
    throw new Error(`Unknown file extension of '${options.configFile}'. Expect a .yaml or .json file`)
  }

  const data = await fs.readFile(options.configFile, 'utf8').catch(e => initExampleConfig(options, e))
  const config = isYaml ? YAML.parse(data) : JSON.parse(data)
  const env = {...process.env, ...{
    HOME: process.env['HOME'] || process.env['HOMEPATH'],
    CWD: path.resolve(path.dirname(options.configFile))
  } }

  expandConfigDefaults(config, env)
  resolveConfig(config, env)
  await validateConfig(config)
    .catch(e => {
      console.log(`Check your expanded configuration file:`)
      console.log(YAML.stringify(config))
      throw e
    })
  console.log(`Loaded gallery configuration from ${options.configFile}`)
  options.config = config;
  return options;
}

module.exports = { loadConfig }
