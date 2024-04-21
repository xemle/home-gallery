const { Writable } = require('stream')

const write = (cb) => {
  return new Writable({
    objectMode: true,
    write: function(chunk, _, next) {
      cb(chunk)
      next()
    }
  })
}

module.exports = write;
