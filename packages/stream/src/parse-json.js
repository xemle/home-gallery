const { Transform } = require('stream')

const parseJson = () => {
  const chunks = [];
  return Transform({
    objectMode: true,
    transform: function (chunk, enc, next) {
      chunks.push(chunk)
      chunk = null
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

module.exports = parseJson;
