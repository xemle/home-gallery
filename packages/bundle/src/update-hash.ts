import fs from 'fs/promises'
import path from 'path'
import { hash } from './hash'

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

export const updateHash = async (files: string[], algorithm: string, hashFile: string) => {
  const hashes = await Promise.all(files.map(file => hash(file, algorithm)))
  const newHases = files.reduce((result: any, file, i) => {
    const filename = path.relative(path.dirname(hashFile), file)
    result[filename] = hashes[i]
    return result
  }, {})

  const oldHashes = await read(hashFile)
  const updatedHashes = Object.assign(oldHashes, newHases)
  return write(updatedHashes, hashFile)
}