import { pipeline, Writable } from 'stream'

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

export const mergeLogStream = (rootLogger, readable) => {
  readable.setEncoding('utf8')

  pipeline(
    readable,
    splitStream(),
    logWriteable(rootLogger.write),
    err => {
      if (err) {
        rootLogger.error(err, `Error piping to log: ${err}`)
      }
    }
  )
}
