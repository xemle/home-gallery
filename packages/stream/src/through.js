const { Transform } = require('stream')

const through = (transform, flush) => {
  return new Transform({
    objectMode: true,
    transform,
    flush
  })
}

module.exports = through