"use strict";
import pino from 'pino'

import { createPrettyStream } from './pretty-stream.js'
import { createFileStream } from './file-stream.js'
import { createJsonStream } from './json-stream.js'
import { mergeLogStream } from './merge-log-stream.js'

export type TCustonPinoLogger = pino.Logger & {
  add: (stream: pino.DestinationStream | pino.StreamEntry) => void
  write: (data: any) => void
}

let instance: TCustonPinoLogger

const hasFirstArgNumber = inputArgs => inputArgs.length >= 2 && typeof inputArgs[0] == 'number'
const splitErrorStackLines = inputArgs => {
  if (inputArgs.length < 2 || typeof inputArgs[0].message != 'string' || typeof inputArgs[0].stack != 'string') {
    return
  }
  inputArgs[0].stack = inputArgs[0].stack.split('\n')
}

type CustomMultiStream = pino.MultiStreamRes & {lastLevel?: number, add: (stream: pino.MultiStreamRes) => void}

const createInstance = options => {
  options = options || {}
  const ms = pino.multistream([]) as CustomMultiStream
  const logger = pino({
    level: 'trace',
    hooks: {
      logMethod (inputArgs, method) {
        if (hasFirstArgNumber(inputArgs)) {
          const startTime: number = +(inputArgs.shift() || "0")
          // @ts-ignore
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

  return logger as TCustonPinoLogger
}

const isString = v => typeof v == 'string'

const toOptions = options => isString(options) ? {module: options} : options

export type TLoggerStatic = {
  add: (stream: pino.DestinationStream | pino.StreamEntry) => void
  addPretty: (level?: string) => void
  addFile: (filename: string, level?: string, cb?: (err: Error) => void) => void
  addJson: (level?: string) => void
  mergeLog: (readable: NodeJS.ReadableStream, jsonLogMapper?: false | ((log: any) => any)) => void
}

export type TLogger = pino.Logger & TLoggerStatic

export type TLoggerFactory = {
  (options: any): TLogger
  getInstance: () => TCustonPinoLogger,
} & TLoggerStatic

function LoggerFactory(options: any) {
  if (!instance) {
    instance = createInstance(toOptions(options))
    return instance
  } else {
    return instance.child(toOptions(options))
  }
}

Object.assign(LoggerFactory, {
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

export const Logger: TLoggerFactory = LoggerFactory as TLoggerFactory


export default Logger
