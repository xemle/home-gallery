import { Transform } from 'stream'

export const through = (transform, flush) => {
  return new Transform({
    objectMode: true,
    transform,
    flush
  })
}
