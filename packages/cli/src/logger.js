const logger = require('@home-gallery/logger')

const { load } = require('./config')

const loggerOptions = {
  'log-level': {
    alias: 'l',
    default: 'info',
    type: 'string',
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'silent'],
    describe: 'console log level'
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

const addFileLogger = async (file, level) => new Promise(resolve => logger.addFile(file, level, resolve))

const loggerMiddleware = async (argv) => {
  const logMessages = []

  const enabledLoggers = {
    console: false,
    file: false
  }

  if (argv.logLevel) {
    logger.addPretty(argv.logLevel)
    logMessages.push(`Add console logger in level ${argv.logLevel} through cli args`)
    enabledLoggers.console = true
  }
  if (argv.logFile) {
    await addFileLogger(argv.logFile, argv.logFileLevel)
    logMessages.push(`Add file logger in level ${argv.logLevel} and file ${argv.logFile} through cli args`)
    enabledLoggers.file = true
  }

  if (argv.config) {
    const { config } = load(argv.config).catch(()=> ({}))
    const loggers = config?.logger || []
    for (const configLogger of loggers) {
      if (enabledLoggers[configLogger.type]) {
        logMessages.push(`Skip ${configLogger.type} logger by config. Logger was already initialized through cli args`)
        continue
      }

      if (configLogger.type == 'console') {
        logger.addPretty(configLogger.level)
        logMessages.push(`Add console logger in level ${configLogger.level} through cli args`)
      } else if (configLogger.type == 'file') {
        await addFileLogger(configLogger.file, configLogger.level)
        logMessages.push(`Add file logger in level ${configLogger.level} and file ${configLogger.file} through config`)
      }
    }
  }

  const log = logger('cli.logger')
  logMessages.forEach(msg => log.trace(msg))
}

module.exports = {
  loggerOptions,
  loggerMiddleware
}
