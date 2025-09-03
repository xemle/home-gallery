import { pipeline, Transform, PassThrough, Writable } from 'stream'

import { splitStream } from './utils/split-stream.js'

const logWriteable = logWrite => {
  return new Writable({
    objectMode: true,
    write(data, _, cb) {
      logWrite(data)
      cb()
    }
  })
}

const createLogMapper = (jsonLogMapper) => {
  if (!jsonLogMapper) {
    return new PassThrough()
  }

  function transform(chunk, _, cb) {
    try {
      let json = JSON.parse(chunk)
      let log = jsonLogMapper(json)
      const data = JSON.stringify(log)
      json = null
      log = null
      return cb(null, data)
    } catch (e) {
      return cb(null, chunk)
    }
  }

  return new Transform({
    objectMode: true,
    transform,
  })
}

export const mergeLogStream = (rootLogger, readable, jsonLogMapper) => {
  readable.setEncoding('utf8')

  pipeline(
    readable,
    splitStream(),
    createLogMapper(jsonLogMapper),
    logWriteable(rootLogger.write),
    err => {
      if (err) {
        rootLogger.error(err, `Error piping to log: ${err}`)
      }
    }
  )
}
