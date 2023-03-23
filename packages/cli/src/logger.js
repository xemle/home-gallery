const logger = require('@home-gallery/logger')

const { load } = require('./config')

const loggerOptions = {
  'log-level': {
    alias: 'l',
    default: 'info',
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

const addFileLogger = async (file, level = 'info') => new Promise(resolve => logger.addFile(file, level, resolve))

const loggerMiddleware = async (argv) => {
  const logMessages = []

  if (argv.logLevel && argv.logJsonFormat) {
    logger.addJson(argv.logLevel)
    logMessages.push(`Add json console logger in level ${argv.logLevel} through cli args`)
  } else if (argv.logLevel) {
    logger.addPretty(argv.logLevel)
    logMessages.push(`Add console logger in level ${argv.logLevel} through cli args`)
  }
  if (argv.logFile) {
    await addFileLogger(argv.logFile, argv.logFileLevel)
    logMessages.push(`Add file logger in level ${argv.logFileLevel || 'info'} and file ${argv.logFile} through cli args`)
  }

  if (argv.config && !logMessages) {
    const { config } = await load(argv.config).catch(()=> ({}))
    const loggers = config?.logger || []
    for (const configLogger of loggers) {
      if (configLogger.type == 'console' && configLogger.format == 'json') {
        logger.addJson(configLogger.level)
        logMessages.push(`Add json console logger in level ${configLogger.level} through config`)
      } else if (configLogger.type == 'console') {
        logger.addPretty(configLogger.level)
        logMessages.push(`Add console logger in level ${configLogger.level} through config`)
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
