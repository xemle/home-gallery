import path from 'path'
import { access } from 'fs/promises'

import { createRandomString } from '../utils/index.js'

export const createTmpFile = async (filename, suffix = '.tmp', prefix = '.') => {
  const parentDir = path.dirname(filename)
  await access(parentDir).catch(() => { throw new Error(`Directory ${parentDir} does not exist`) })

  const tmp = path.resolve(parentDir, `${prefix}${path.basename(filename)}.${createRandomString()}${suffix}`)

  return access(tmp).then(() => createTmpFile(filename), () => tmp)
}
