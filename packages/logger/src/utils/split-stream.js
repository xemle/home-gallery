import { Transform } from 'stream'

import { Splitter } from './Splitter.js'

export const splitStream = (sep = '\n') => {
  const splitter = new Splitter(sep)
  return new Transform({
    objectMode: true,
    transform(chunk, _, cb) {
      splitter.append(chunk)
      let it = splitter.next()
      while (!it.done) {
        this.push(it.value)
        it = splitter.next()
      }
      cb()
    }
  })
}
