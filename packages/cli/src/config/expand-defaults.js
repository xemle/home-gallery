const { useEnvDefaults } = require('./env')
const { mapConfig } = require('./map-args')

const defaultVars = {
  baseDir: '~',
  configDir: '{baseDir}/.config/home-gallery',
  configPrefix: '',
  cacheDir: '{baseDir}/.cache/home-gallery'
}

const keyValueToProps = (keyName, valueName) => {
  return obj => {
    if (Object.entries(obj).length == 1) {
      const [key, value] = Object.entries(obj)[0]
      return { [keyName]: key, [valueName]: value }
    }
    return obj
  }
}

const expandConfigDefaults = (config, env) => {
  const vars = {...defaultVars}
  useEnvDefaults(vars, env)
  Object.entries(vars).forEach(([key, value]) => config[key] = config[key] || value)

  if (config.sources && config.sources.length) {
    for (const i in config.sources) {
      const dir = config.sources[i]
      const source = typeof dir == 'string' ? { dir } : dir
      config.sources[i] = Object.assign({
        index: '{configDir}/{configPrefix}{basename(dir)}.idx',
        offline: false,
        excludeIfPresent: '.galleryignore'
      }, source)
    }
  }

  config.storage = Object.assign({
    dir: '{cacheDir}/storage'
  }, config.storage);

  config.database = Object.assign({
    file: '{configDir}/{configPrefix}database.db'
  }, config.database);

  config.events = Object.assign({
    file: '{configDir}/{configPrefix}events.db'
  }, config.events);

  config.logger = config.logger || [
    {type: 'console', level: 'info'},
    {type: 'file', level: 'debug', file: '{configDir}/{configPrefix}gallery.log'}
  ]

  const mappings = {
    'server.auth.users': keyValueToProps('username', 'password'),
    'server.auth.rules': keyValueToProps('type', 'value')
  }

  return mapConfig(config, mappings)
}

module.exports = {
  expandConfigDefaults
}
