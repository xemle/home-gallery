const crypto = require('crypto')

const toSha1 = buffer => {
  var shasum = crypto.createHash('sha1')
  shasum.update(buffer)
  return shasum.digest('hex')
}

module.exports = toSha1;