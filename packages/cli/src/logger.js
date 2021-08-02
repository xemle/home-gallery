const logger = require('@home-gallery/logger')

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

const loggerMiddleware = async (argv) => {
  if (argv.logLevel) {
    logger.addPretty(argv.logLevel)
  }
  if (argv.logFile) {
    await new Promise(resolve => logger.addFile(argv.logFile, argv.logFileLevel, resolve))
  }
}

module.exports = {
  loggerOptions,
  loggerMiddleware
}
