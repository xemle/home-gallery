import { createReadStream } from 'fs'
import { access } from 'fs/promises'
import { pipeline, Readable } from 'stream'
import { createGunzip } from 'zlib'
import { through } from '@home-gallery/stream'

import Logger from '@home-gallery/logger'

const log = Logger('database.readStream')

export const createReadableStream = async (filename) => {
  const exists = await access(filename).then(() => true, () => false)
  if (!exists) {
    throw new Error(`Database ${filename} does not exists`)
  }

  return pipeline(
    createReadStream(filename),
    createGunzip(),
    createEntrySplitter(filename),
    // emptyErrorHandler: credits to https://medium.com/homullus/catching-errors-in-nodejs-stream-pipes-3ba9d258cc68
    function emptyErrorHandler() {}
  )
}

export const createOrEmptyReadableStream = async (databaseFilename) => {
  return createReadableStream(databaseFilename)
    .then(stream => {
      log.info(`Reading database entries from ${databaseFilename}`)
      return stream
    })
    .catch(async err => {
      if (err.code != 'ENOENT') {
        throw err
      }
      log.info(`Database file ${databaseFilename} not found. Initialize new database`)
      return Readable.from([])
    })
}

export const createEntrySplitter = (filename) => {
  let isFirstChunk = true
  let data = ''
  let totalPos = 0

  const stream = through(function(chunk, enc, cb) {
    data += chunk.toString('utf8')
    let pos = 0
    if (isFirstChunk) {
      const [err, end, head] = findHeader(data)
      if (err) {
        return cb(new Error(`Failed to read database header from ${filename}: ${err}`))
      } else if (end < 0) {
        return cb()
      } else {
        stream.emit('head', head)
        pos = end
        isFirstChunk = false
      }
    }

    let [err, end, entry] = findNextEntry(data, pos)
    while (!err && end > 0) {
      this.push(entry)
      pos = end
      const next = findNextEntry(data, pos)
      err = next[0]
      end = next[1]
      entry = next[2]
    }
    totalPos += pos
    if (err) {
      log.warn(err, `Failed to read entry at ${totalPos}`)
    }
    data = data.substring(pos)
    cb()

  }, function(cb) {
    if (isFirstChunk) {
      return cb(new Error(`Could not find database header`))
    } else if (data == ']}') {
      return cb()
    }

    const [err, end, entry] = findLastEntry(data, 0)
    if (err) {
      log.warn(err, `Failed to find last entry at ${totalPos}`)
      return cb()
    } else if (end < 0) {
      log.trace(`No entries found`)
      return cb()
    }

    this.push(entry)
    cb()
  })
  return stream
}

/**
 * @typedef DatabaseHeader
 * @prop {string} type
 * @prop {string} created
 * @prop {object[]} data
 */

/**
 * @param {string} data
 * @returns {[Error, number, DatabaseHeader]}
 */
const findHeader = (data) => {
  const headStart = '{"type":"home-gallery/database'
  const dataProp = ',"data":['
  if (data.length < 82) {
    return [null, -1]
  } else if (!data.startsWith(headStart)) {
    return [new Error(`Unknown file start`)]
  }

  const pos = data.indexOf(dataProp)
  if (pos < 0) {
    return [null, -1]
  }
  try {
    const end = pos + dataProp.length
    const json = data.substring(0, end) + ']}'
    const header = JSON.parse(json)
    return [null, end, header]
  } catch (e) {
    return [e, 0, end]
  }
}

const findNextIdType = (data, start = 0) => {
  const idPrefix = '{"id":"'
  const idKeyValueLength = idPrefix.length + 42 // 40 sha1sum + '",
  if (start + idKeyValueLength >= data.length) {
    return -1
  }
  const pos = data.indexOf(idPrefix, start)
  if (pos < 0) {
    return pos
  }
  const nextProp = data.substring(pos + idKeyValueLength, pos + idKeyValueLength + 7)
  if (nextProp != '"type":' && nextProp != '"hash":') {
    return findNextIdType(data, pos + idPrefix.length)
  }
  return pos
}

/**
 * @typedef DatabaseEntry
 * @prop {string} id
 * @prop {string} [hash]
 * @prop {string} type
 */
/**
 * @param {string} data
 * @param {number} start
 * @returns {[Error, number, DatabaseEntry]}
 */
const findNextEntry = (data, start = 0) => {
  const pos = findNextIdType(data, start)
  if (pos < 0) {
    return [null, -1]
  }
  const posNext = findNextIdType(data, pos + 1)
  if (posNext < 0) {
    return [null, -1]
  }
  const curlyEnd = data.lastIndexOf('}', posNext)
  if (curlyEnd < pos) {
    return [null, -1]
  }
  try {
    const json = data.substring(pos, curlyEnd + 1)
    const entry = JSON.parse(json)
    return [null, curlyEnd + 1, entry]
  } catch (e) {
    return [e]
  }
}

/**
 * @param {string} data
 * @param {number} start
 * @returns {[Error, number, DatabaseEntry]}
 */
const findLastEntry = (data, start = 0) => {
  const pos = findNextIdType(data, start)
  if (pos < 0) {
    return [null, -1]
  }
  const arrayEnd = data.lastIndexOf(']}')
  if (arrayEnd < pos) {
    return [null, -1]
  }
  const curlyEnd = data.lastIndexOf('}', arrayEnd)
  if (curlyEnd < pos) {
    return [null, -1]
  }
  try {
    const json = data.substring(pos, curlyEnd + 1)
    const entry = JSON.parse(json)
    return [null, curlyEnd + 1, entry]
  } catch (e) {
    return [e]
  }
}
