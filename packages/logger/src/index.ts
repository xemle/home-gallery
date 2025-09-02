import pino from 'pino'

const createLogger = () => {
  const logger = pino({
    browser: {
      asObject: false
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin(_context, level) {
      return { 'levelName': logger.levels.labels[level] }
    }
  })

  function factory(module) {
    return logger.child({module})
  }

  /**
   * @param {string} level Level like 'info' or 'debug'
   */
  factory.setLevel = level => {
    logger.level = level
  }

  return factory
}

const Logger = createLogger()

export default Logger