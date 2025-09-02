import { through } from './through.js'

export const noop = () => through((entry, enc, cb) => cb(null, entry))