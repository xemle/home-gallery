const { pipeline, Writable } = require('stream')

const splitStream = require('./utils/split-stream')

const logWriteable = logWrite => {
  return new Writable({
    objectMode: true,
    write(data, _, cb) {
      logWrite(data)
      cb()
    }
  })
}

const mergeLogStream = (rootLogger, readable) => {
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

module.exports = mergeLogStream