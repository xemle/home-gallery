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
      let data
      try {
        data = JSON.parse(Buffer.concat(chunks).toString())
        this.push(data)
        next(null);
      } catch (e) {
        next(new Error(`Could not parse JSON: ${e}`))
      }
      data = null;
      chunks.splice(0, chunks.length)
    }
  });
}

module.exports = parseJson;
