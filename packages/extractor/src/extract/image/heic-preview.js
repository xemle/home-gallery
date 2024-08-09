import { Buffer } from 'buffer'
import fs from 'fs/promises'
import path from 'path'
import heicDecode from 'heic-decode'

import Logger from '@home-gallery/logger'

import { toPlugin } from '../pluginUtils.js';

const log = Logger('extractor.image.heic')

let sharp
let jpegJs

const imageTypes = ['rawImage']

const rawPreviewSuffix = 'raw-preview.jpg'

const sharpJpgOptions = {
  quality: 90,
  progressive: true,
  optimiseCoding: true,
  mozjpeg: true // same as {trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3}
}

const fileExtension = filename => {
  const pos = filename.lastIndexOf('.')
  return pos > 0 ? filename.slice(pos + 1) : ''
}

const matchExt = test => entry => fileExtension(entry.filename).toLowerCase().match(test)

const isJpg = matchExt(/jpe?g/)

const isHeic = matchExt(/hei[cf]/)

const hasJpg = entry => isJpg(entry) || entry.sidecars?.find(isJpg)

/**
 * @param {import('@home-gallery/types').TExtractorEntry} entry
 * @returns {import('@home-gallery/types').TExtractorEntry | undefined}
 */
const findHeicEntry = entry => isHeic(entry) ? entry : entry.sidecars?.find(isHeic)

const hasHeic = entry => !!findHeicEntry(entry)

const arrayBuffer2Buffer = data => Buffer.from(new Uint8Array(data))

/**
 * @typedef {object} TJpgWriterOptions
 * @prop {number} weight
 * @prop {number} height
 * @prop {any[]} data
 *
 * @typedef {callback} TJpgWriter
 * @param {TJpgWriterOptions} options
 * @param {number} maxSize
 * @param {string} dst
 * @returns {Promise<void>}
 */
/**
 * @type {TJpgWriter}
 */
const sharpJpgWriter = async ({width, height, data}, maxSize, dst) => {
  const image = sharp(data, { raw: {width, height, channels: 4}})
  const resize = Math.max(width, height) > maxSize ? image.resize({width: maxSize, height: maxSize, fit: 'inside'}) : image
  return resize.jpeg(sharpJpgOptions).toFile(dst)
}

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {import('./image-resizer.js').ImageResizer} imageResizer
 */
const createFallbackJpgWriter = (storage, imageResizer) => async ({width, height, data}, maxSize, dst) => {
  const t0 = Date.now()
  const result = jpegJs.encode({width, height, data}, sharpJpgOptions.quality)
  log.debug(t0, `Encoded raw image data (${width}x${height}) to JPEG via jpeg-js`)
  if (Math.max(width, height) <= maxSize) {
    return fs.writeFile(dst, result.data)
  }

  const t1 = Date.now()
  const localDir = await storage.createLocalDir()
  const tmpFile = path.resolve(localDir.dir, 'heic-resize.jpg')
  return fs.writeFile(tmpFile, result.data)
    .then(() => imageResizer(tmpFile, dst, maxSize))
    .then(() => {
      log.debug(t1, `Resized heic preview to ${maxSize}`)
    })
    .finally(() => localDir.release())
}

/**
 * @param {string} src
 * @param {number} maxSize
 * @param {string} dst
 * @param {TJpgWriter} jpgWriter
 * @returns {Promise<void>}
 */
const convertHeic = async (src, maxSize, dst, jpgWriter) => {
  const t0 = Date.now()
  return fs.readFile(src)
    .then(buffer => heicDecode({ buffer }))
    .then(({width, height, data}) => {
      log.debug(t0, `Decoded heic image to raw image data (${width}x${height})`)
      return jpgWriter({width, height, data: arrayBuffer2Buffer(data)}, maxSize, dst)
    })
}

/**
 * @param {import('./image-resizer.js').ImageResizer} imageResizer
 * @param {boolean} isNativeImageResizer
 * @returns {Promise<TJpgWriter>}
 */
const initJpgWriter = async (storage, imageResizer, isNativeImageResizer) => {
  if (!isNativeImageResizer) {
    return import('sharp')
      .then(lib => {
        sharp = lib.default
        log.debug(`Use sharp as HEIC JPEG writer`)
        return sharpJpgWriter
      })
      .catch(e => {
        log.warn(e, `Could not load sharp to write JPG`)
        return import('jpeg-js')
          .then(lib => {
            jpegJs = lib
            log.warn(`Use slower jpeg-js to write JPG`)
            return createFallbackJpgWriter(storage, imageResizer)
          })
      })
  } else {
    return import('jpeg-js')
      .then(lib => {
        jpegJs = lib
        log.warn(`Use slower jpeg-js to write JPG`)
        return createFallbackJpgWriter(storage, imageResizer)
      })
  }
}

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {number[]} imagePreviewSizes
 * @param {TJpgWriter} jpgWriter
 * @returns {import('stream').Transform}
 */
export async function heicPreview(storage, imagePreviewSizes, jpgWriter) {

  const test = entry => {
    if (!imageTypes.includes(entry.type) || hasJpg(entry) || storage.hasFile(entry, rawPreviewSuffix)) {
      return false
    }
    if (hasHeic(entry)) {
      return true
    }
    return false
  }

  const task = async (entry) => {
    const t0 = Date.now()

    const heicEntry = findHeicEntry(entry)
    const src = await heicEntry.getFile()
    const localFile = await storage.createLocalFile(entry, rawPreviewSuffix)
    const maxSize = Math.max(...imagePreviewSizes) || 1920
    return convertHeic(src, maxSize, localFile.file, jpgWriter)
      .then(() => localFile.commit())
      .then(() => {
        log.debug(t0, `Created jpg preview image from heic image of ${entry}`)
      })
      .catch(err => {
        return localFile.release()
          .finally(() => {
            log.error(err, `Failed to convert heic image of ${entry}`)
          })
      })
  }

  return {
    test,
    task
  }
}

/**
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns {import('@home-gallery/types').TExtractor}
 */
const heicPlugin = manager => ({
  name: 'heic',
  phase: 'raw',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create(storage) {
    const context = manager.getContext()
    const { imageResizer, isNativeImageResizer, imagePreviewSizes } = context
    const jpgWriter = await initJpgWriter(storage, imageResizer, isNativeImageResizer)

    return heicPreview(storage, imagePreviewSizes, jpgWriter)
  },
})

const plugin = toPlugin(heicPlugin, 'heicPreviewExtractor', ['imageResizeExtractor'])

export default plugin
