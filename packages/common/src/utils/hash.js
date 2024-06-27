import crypto from 'crypto'

export const createHash = s => crypto.createHash('sha1').update(s).digest('hex')

