"use strict";
const pino = require('pino')

const prettyStream = require('./pretty-stream')
const fileStream = require('./file-stream')

let instance;

const hasFirstArgNumber = inputArgs => inputArgs.length >= 2 && typeof inputArgs[0] == 'number'

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
        return method.apply(this, inputArgs)
      }
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin(_context, level) {
      return { 'levelName': logger.levels.labels[level] }
    }
  }, ms)

  logger.add = stream => ms.add(stream)

  return logger
}

const createPrettyStream = level => {
  if (!instance) {
    console.log(`No logging instance exists`)
  }
  instance.add({level: level || 'info', stream: prettyStream()})
}

const createFileStream = (filename, level, cb) => {
  if (!instance) {
    return cb ? cb(new Error(`No logging instance exists`)) : console.log(`No logging instance exists`)
  }
  fileStream(filename, (err, stream) => {
    if (err && cb) {
      cb(err)
    } else if (err) {
      instance.err(`Could not create file logger for ${fileanme}: ${err}`)
    } else {
      instance.add({ level: level || 'info', stream: stream })
      cb && cb()
    }
  })
}

const isString = v => typeof v == 'string'

const toOptions = options => isString(options) ? {module: options} : options

function logger(options) {
  if (!instance) {
    instance = createInstance(toOptions(options))
    return instance
  } else {
    return instance.child(toOptions(options))
  }
}

logger.getInstance = () => instance
logger.add = dest => instance && instance.add(dest)
logger.addPretty = createPrettyStream
logger.addFile = createFileStream

module.exports = logger
