const crypto = require('crypto')

const createHash = s => crypto.createHash('sha1').update(s).digest('hex')

module.exports = createHash

