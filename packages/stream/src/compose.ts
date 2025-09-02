import { pipeline, Transform} from 'stream'

/**
 * Compose streams of pipeline into one Transform stream
 *
 * @param {Transform} streams
 * @returns {Transform} Composed stream
 */
export const compose = (...streams) => {
  const first = streams[0]

  const last = pipeline(
    ...streams,
    function emptyErrorHandler() {}
  )

  const stream = new Transform({
    writableObjectMode: first.writableObjectMode,
    readableObjectMode: last.readableObjectMode,
    transform(chunk, enc, cb) {
      first.write(chunk, enc, cb)
    },
    flush(cb) {
      first.end()
      last.once('finish', cb)
    }
  })

  last.on('data', chunk => stream.emit('data', chunk))
  last.once('error', err => stream.emit('error', err))

  return stream;
}