import { Writable } from 'stream'

export const write = (cb) => {
  return new Writable({
    objectMode: true,
    write: function(chunk, _, next) {
      cb(chunk)
      next()
    }
  })
}
