"use strict";
import pino from 'pino'

import { createPrettyStream } from './pretty-stream.js'
import { createFileStream } from './file-stream.js'
import { createJsonStream } from './json-stream.js'
import { mergeLogStream } from './merge-log-stream.js'

let instance;

const hasFirstArgNumber = inputArgs => inputArgs.length >= 2 && typeof inputArgs[0] == 'number'
const splitErrorStackLines = inputArgs => {
  if (inputArgs.length < 2 || typeof inputArgs[0].message != 'string' || typeof inputArgs[0].stack != 'string') {
    return
  }
  inputArgs[0].stack = inputArgs[0].stack.split('\n')
}

const createInstance = options => {
  options = options || {}
  const ms = pino.multistream([])
  const logger = pino({
    level: 'trace',
    hooks: {
      logMethod (inputArgs, method) {
        if (hasFirstArgNumber(inputArgs)) {
          const startTime = inputArgs.shift()
          return method.apply(this, [{duration: Date.now() - startTime}, ...inputArgs])
        }
        splitErrorStackLines(inputArgs)
        return method.apply(this, inputArgs)
      }
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin(_context, level) {
      return { 'levelName': logger.levels.labels[level] }
    }
  }, ms)

  logger.add = stream => ms.add(stream)

  /**
   * Before write() of multistream is called the actual log level
   * is set in write() in proto.js. We emulate that behavior here
   * to call write() of multistream directly to inject/forward
   * the log message to the real loggers.
   *
   * @param {string} data
   */
  const fixLastLevel = data => {
    try {
      const log = JSON.parse(data)
      ms.lastLevel = log.level
    } catch (e) {
      ms.lastLevel = 30 // info level as fallback
    }
  }

  logger.write = data => {
    fixLastLevel(data)
    ms.write(data)
  }

  return logger
}

const isString = v => typeof v == 'string'

const toOptions = options => isString(options) ? {module: options} : options

function Logger(options) {
  if (!instance) {
    instance = createInstance(toOptions(options))
    return instance
  } else {
    return instance.child(toOptions(options))
  }
}

Object.assign(Logger, {
  getInstance: () => instance,
  add: dest => instance && instance.add(dest),
  addPretty: (level = 'info') => instance && createPrettyStream(instance, level),
  addFile: (filename, level, cb) => instance && createFileStream(instance, filename, level, cb),
  addJson: (level = 'info') => instance && createJsonStream(instance, level),
  /**
   * @param {Function} jsonLogMapper Optional json mapper
   */
  mergeLog: (readable, jsonLogMapper = false) => instance && mergeLogStream(instance, readable, jsonLogMapper),
})

export {
  Logger
}
export default Logger
