import { access, mkdir } from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import { Readable } from 'stream'

import { logger } from './log.js'

const log = logger('caxa')

const exists = async (file: string) => access(file).then(() => true, () => false)

const findPackage = async (dir: string, packageName: string): Promise<string> => {
  const packageDir = path.join(dir, 'node_modules', packageName)
  const found = await exists(packageDir)
  if (found) {
    return packageDir
  }
  const parent = path.dirname(dir)
  if (parent != dir) {
    return findPackage(parent, packageName)
  }
  return Promise.reject(new Error(`Could not found package`))
}

const findStub = async (platform: string) => {
  const caxa = await findPackage(__dirname, 'caxa')
  switch (platform) {
    case 'darwin':
      return path.join(caxa, 'stubs', 'macos')
    case 'win':
      return path.join(caxa, 'stubs', 'windows.exe')
    default:
      return path.join(caxa, 'stubs', 'linux')
  }
}

const copy = async (src: Readable, dst: string, appending: boolean = true) => {
  return new Promise((resolve, reject) => {
    src
      .pipe(createWriteStream(dst, { flags: appending ? 'a' : 'w'}))
      .on('finish', resolve)
      .on('error', reject)
  })
}

const copyFile = async (src: string, dst: string, appending: boolean = true) => {
  return copy(createReadStream(src), dst, appending)
}

const copyData = async (data: string, dst: string, appending: boolean = true) => {
  return copy(Readable.from(data), dst, appending)
}

export const pack = async (archive: string, archivePrefix: string, identifier: string, platform: string, command: string[], output: string) => {
  await mkdir(path.dirname(output), {recursive: true})
  const stub = await findStub(platform)

  await copyFile(stub, output, false)
  await copyFile(archive, output)

  const data = '\n' + JSON.stringify({
    identifier,
    command
  })
  await copyData(data, output)
}