import fs from 'fs/promises'
import path from 'path'

import { logger } from './log'
import { hash } from './hash'

const log = logger('updateHash');

const read = async (hashFile: string) => {
  const content = await fs.readFile(hashFile, 'utf8')
    .catch(() => '')
  return content.split('\n')
    .filter(line => line.length)
    .reduce((result: any, line: string) => {
      const [hash, file] = line.split('  ')
      result[file] = hash
      return result
    }, {})
}

const write = async (hashes: any, hashFile: string) => {
  const files = Object.keys(hashes).sort()
  const content = files.map(file => `${hashes[file]}  ${file}`).join('\n')
  return fs.writeFile(hashFile, content, 'utf8')
}

export const updateHash = async (file: string, algorithm: string, hashFile: string) => {
  const fileHash = await hash(file, algorithm)
  log.info(`Calculated ${algorithm} hash for '${file}': ${fileHash}`)
  const filename = path.relative(path.dirname(hashFile), file)
  const newHashes : {[key: string]: string}= {}
  newHashes[filename] = fileHash

  const oldHashes = await read(hashFile)
  const updatedHashes = Object.assign(oldHashes, newHashes)
  return write(updatedHashes, hashFile)
}