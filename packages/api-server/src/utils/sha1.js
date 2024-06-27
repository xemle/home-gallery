import crypto from 'crypto'

export const toSha1 = buffer => {
  var shasum = crypto.createHash('sha1')
  shasum.update(buffer)
  return shasum.digest('hex')
}
