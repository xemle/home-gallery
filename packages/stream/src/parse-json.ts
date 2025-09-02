import { Transform } from 'stream'

export const parseJson = () => {
  const chunks: Buffer[] = [];
  return new Transform({
    objectMode: true,
    transform: function (chunk: Buffer, enc, next) {
      chunks.push(chunk)
      next()
    },
    flush: function(next) {
      let json
      try {
        const data = Buffer.concat(chunks).toString('utf8')
        chunks.splice(0, chunks.length)
        json = JSON.parse(data)
      } catch (e) {
        json = null
        return next(new Error(`Could not parse JSON: ${e}`))
      }
      this.push(json)
      next(null)
    }
  });
}
