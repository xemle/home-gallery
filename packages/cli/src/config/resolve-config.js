import { resolveAll } from './resolve.js'

export const resolveConfig = (config, baseDir, env) => {
  resolveAll(config, ['baseDir', 'configDir', 'configPrefix', 'cacheDir'], config, baseDir, env)

  const sources = config.sources || [];
  for (const source of sources) {
    resolveAll(source, ['dir', 'index', 'excludeIfPresent', 'excludeFromFile'], config, baseDir, env)
  }

  resolveAll(config, ['storage.dir', 'database.file', 'events.file', 'server.key', 'server.cert'], config, baseDir, env)

  const loggers = config.logger || [];
  for (const logger of loggers) {
    resolveAll(logger, ['file'], config, baseDir, env)
  }

  return config
}
