import { Transform } from 'stream'

export const through = (transform: (this: Transform, chunk: any, enc, cb: (err?: Error | null, chunk?: any) => void) => any, flush?: (this: Transform, cb: (err?: Error | null) => void) => void) => {
  return new Transform({
    objectMode: true,
    transform,
    flush
  })
}
