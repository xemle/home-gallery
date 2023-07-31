const { Buffer } = require('buffer')
const fs = require('fs').promises
const heicDecode = require('heic-decode')

const { promisify } = require('@home-gallery/common')
const log = require('@home-gallery/logger')('extractor.image.heic')
const { toPipe, conditionalTask } = require('../../stream/task')

const { useExternalImageResizer } = require('./image-resizer')

let sharp
let jpegJs

const imageTypes = ['rawImage']

const rawPreviewSuffix = 'raw-preview.jpg'

const maxSize = 1920

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

const findHeicEntry = entry => isHeic(entry) ? entry : entry.sidecars?.find(isHeic)

const hasHeic = entry => !!findHeicEntry(entry)

const arrayBuffer2Buffer = data => Buffer.from(new Uint8Array(data))

const sharpJpgWriter = async ({width, height, data}, maxSize, dst) => {
  const image = sharp(data, { raw: {width, height, channels: 4}})
  const resize = Math.max(width, height) > maxSize ? image.resize({width: maxSize, height: maxSize, fit: 'inside'}) : image
  return resize.jpeg(sharpJpgOptions).toFile(dst)
}

const createFallbackJpgWriter = imageResizer => async ({width, height, data}, maxSize, dst) => {
  const t0 = Date.now()
  const result = jpegJs.encode({width, height, data}, sharpJpgOptions.quality)
  log.debug(t0, `Encoded raw image data (${width}x${height}) to JPEG via jpeg-js`)
  if (Math.max(width, height) <= maxSize) {
    return fs.writeFile(dst, result.data)
  }

  const t1 = Date.now()
  const tmp = `${dst}.tmp.jpg`
  return fs.writeFile(tmp, result.data)
    .then(() => imageResizer(tmp, dst, maxSize))
    .then(() => {
      log.debug(t1, `Resized heic preview to ${maxSize}`)
      return fs.unlink(tmp)
    })
}

const convertHeic = async (src, maxSize, dst, jpgWriter) => {
  const t0 = Date.now()
  return fs.readFile(src)
    .then(buffer => heicDecode({ buffer }))
    .then(({width, height, data}) => {
      log.debug(t0, `Decoded heic image to raw image data (${width}x${height})`)
      return jpgWriter({width, height, data: arrayBuffer2Buffer(data)}, maxSize, dst)
    })
}

const initJpgWriter = (config, imageResizer) => {
  if (!useExternalImageResizer(config)) {
    try {
      sharp = require('sharp')
      return sharpJpgWriter
    } catch (e) {
      log.warn(e, `Could not load sharp to write JPG`)
    }
  }
  if (!sharp) {
    jpegJs = require('jpeg-js')
    log.warn(`Use slower jpeg-js to write JPG`)
    return createFallbackJpgWriter(imageResizer)
  }
}

function heicPreview(storage, extractor, config) {
  const { imageResizer } = extractor

  const jpgWriter = initJpgWriter(config, promisify(imageResizer))

  const test = entry => {
    if (!imageTypes.includes(entry.type) || hasJpg(entry) || storage.hasEntryFile(entry, rawPreviewSuffix)) {
      return false
    }
    if (hasHeic(entry)) {
      return true
    }
    return false
  }

  const task = (entry, cb) => {
    const t0 = Date.now()

    const heicEntry = findHeicEntry(entry)
    const dst = storage.getEntryFilename(entry, rawPreviewSuffix)
    convertHeic(heicEntry.src, maxSize, dst, jpgWriter)
      .then(() => {
        storage.addEntryFilename(entry, rawPreviewSuffix)
        log.debug(t0, `Created jpg preview image from heic image of ${entry}`)
        cb()
      })
      .catch(err => {
        log.error(err, `Failed to convert heic image of ${entry}`)
        cb()
      })
  }

  return toPipe(conditionalTask(test, task))

}

module.exports = heicPreview