const { useEnvDefaults } = require('./resolve')

const expandConfigDefaults = (config, env) => {
  const defaultVars = {
    baseDir: '~',
    configDir: '{baseDir}/.config/home-gallery',
    configPrefix: '',
    cacheDir: '{baseDir}/.cache/home-gallery'
  }
  useEnvDefaults(defaultVars, env)
  Object.assign(config, {...defaultVars, ...config});

  if (config.sources && config.sources.length) {
    for (const i in config.sources) {
      const source = config.sources[i];
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
  return config;
}

module.exports = { expandConfigDefaults }
