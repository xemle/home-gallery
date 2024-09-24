import { useEnvDefaults } from './env.js'
import { mapConfig } from './map-args.js'

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

export const expandConfigDefaults = (config, env) => {
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
  } else {
    config.sources = []
  }

  config.storage = {
    dir: '{cacheDir}/storage',
    ...config.storage
  }

  config.database = {
    file: '{configDir}/{configPrefix}database.db',
    ...config.database
  }

  config.extractor = {
    ...config.extractor,
    stream: {
      concurrent: 0,
      skip: 0,
      limit: 0,
      printEntry: false,
      ...config.extractor?.stream,
    },
    image: {
      previewSizes: [1920, 1280, 800, 320, 128],
      previewQuality: 80,
      ...config.extractor?.image,
    },
    video: {
      previewSize: 720,
      ext: 'mp4',
      ...config.extractor?.video,
    },
    geoReverse: {
      url: 'https://nominatim.openstreetmap.org',
      addressLanguage: 'en',
      ...config.extractor?.geoReverse,
    },
    apiServer: {
      url: 'https://api.home-gallery.org',
      timeout: 30,
      concurrent: 5,
      ...config.extractor?.apiServer
    },
  }

  config.events = {
    file: '{configDir}/{configPrefix}events.db',
    ...config.events
  }

  config.logger = config.logger || [
    {type: 'console', level: 'info'},
    {type: 'file', level: 'debug', file: '{configDir}/{configPrefix}gallery.log'}
  ]

  config.server = {
    host: '0.0.0.0',
    port: 3000,
    openBrowser: true,
    basePath: '/',
    watchSources: true,
    ...config.server
  }

  config.pluginManager = {
    ...config.pluginManager,
    dirs: toArray(config.pluginManager?.dirs || ['plugins']),
    plugins: toArray(config.pluginManager?.plugins || []),
    disabled: toArray(config.pluginManager?.disabled || [])
  }

  const mappings = {
    'server.auth.users': keyValueToProps('username', 'password'),
    'server.auth.rules': keyValueToProps('type', 'value')
  }

  return mapConfig(config, mappings)
}

const toArray = (value, defaultValue = []) => {
  if (typeof value == 'undefined') {
    return defaultValue
  } else if (Array.isArray(value)) {
    return value
  } else {
    return [value]
  }
}