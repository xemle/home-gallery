import path from 'path'
import { createWriteStream as fsCreateWriteStream } from 'fs'
import { access, mkdir, unlink, rename } from 'fs/promises'
import { Transform } from 'stream'

import Logger from '@home-gallery/logger'
import { createTmpFile } from '@home-gallery/common'

const log = Logger('stream.atomicWriteStream')

/**
 * @param {string} filename
 * @returns {Promise<Transform>}
 */
export const createAtomicWriteStream = async (filename) => {
  const parentDir = path.dirname(filename)
  await access(parentDir).catch(() => mkdir(parentDir, {recursive: true}))

  const tmp = await createTmpFile(filename)
  const fileStream = fsCreateWriteStream(tmp, {encoding: 'binary', flush: true})

  return wrapRenameStream(fileStream, tmp, filename)
}

/**
 * @param {Writeable} writeable
 * @param {string} tmp
 * @param {string} filename
 * @returns {Transform} Stream
 */
export const wrapRenameStream = (writeable, tmp, filename) => {
  let errorEmitted = false
  writeable.on('error', () => errorEmitted = true)

  const cleanup = () => {
    return access(tmp)
      .then(() => {
        return unlink(tmp).then(() => {
          log.trace(`Write failed. Remove temporary file ${tmp}`)
        })
      }, () => {}) // tmp does not exist
  }

  const renameFile = (err, cb) => {
    if (err || errorEmitted) {
      return cleanup().then(() => cb(err))
    }

    rename(tmp, filename).then(cb, cb)
  }

  const stream = new Transform({
    transform(chunk, enc, cb) {
      if (errorEmitted) {
        return cb()
      }
      writeable.write(chunk, enc, (err) => {
        if (err) {
          return cleanup().then(() => cb(err))
        }
        cb()
      })
    },
    flush(cb) {
      const end = err => {
        renameFile(err, cb)
      }

      writeable.once('error', end)
      writeable.once('finish', end)
      writeable.end()
    }
  })

  return stream
}