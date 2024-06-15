import logger from '@home-gallery/logger'

import { load } from './config/index.js'

export const loggerOptions = {
  'log-level': {
    alias: 'l',
    type: 'string',
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'silent'],
    describe: 'Console log level'
  },
  'log-json-format': {
    boolean: true,
    describe: 'Log output format in json'
  },
  'log-file': {
    alias: 'L',
    describe: 'Log file'
  },
  'log-file-level': {
    type: 'string',
    choices: ['trace', 'debug', 'info', 'warn', 'error'],
    default: 'debug',
    describe: 'Log file level'
  }
}

const addFileLogger = async (file, level = 'debug') => new Promise(resolve => logger.addFile(file, level, resolve))

export const loggerMiddleware = async (argv) => {
  const logMessages = []
  const enabledLoggers = []

  if (argv.logJsonFormat) {
    logger.addJson(argv.logLevel || 'info')
    enabledLoggers.push('console', 'json')
    logMessages.push(`Add json console logger in level ${argv.logLevel || 'info'} through cli args`)
  } else if (argv.logLevel) {
    logger.addPretty(argv.logLevel)
    enabledLoggers.push('console')
    logMessages.push(`Add console logger in level ${argv.logLevel} through cli args`)
  }
  if (argv.logFile) {
    await addFileLogger(argv.logFile, argv.logFileLevel)
    enabledLoggers.push('file')
    logMessages.push(`Add file logger in level ${argv.logFileLevel || 'debug'} and file ${argv.logFile} through cli args`)
  }

  if (!enabledLoggers.includes('json')) {
    const { config } = await load(argv.config).catch(()=> ({}))
    const loggers = config?.logger || []
    for (const configLogger of loggers) {
      if (enabledLoggers.includes(configLogger.type)) {
        continue
      }
      if (configLogger.type == 'console' && configLogger.format == 'json') {
        logger.addJson(configLogger.level)
        enabledLoggers.push('console', 'json')
        logMessages.push(`Add json console logger in level ${configLogger.level} through config`)
      } else if (configLogger.type == 'console') {
        logger.addPretty(configLogger.level)
        enabledLoggers.push('console')
        logMessages.push(`Add console logger in level ${configLogger.level} through config`)
      } else if (configLogger.type == 'file') {
        await addFileLogger(configLogger.file, configLogger.level)
        enabledLoggers.push('file')
        logMessages.push(`Add file logger in level ${configLogger.level} and file ${configLogger.file} through config`)
      }
    }
  }

  // No explicit loggers are defined by env, args or config
  if (!enabledLoggers.length) {
    logger.addPretty('info')
    logMessages.push(`Add default console logger in level info`)
  }

  const log = logger('cli.logger')
  logMessages.forEach(msg => log.trace(msg))
}
