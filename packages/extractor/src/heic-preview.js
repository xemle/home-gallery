const { Buffer } = require('buffer')
const fs = require('fs')
const heicDecode = require('heic-decode')

let sharp
try {
  sharp = require('sharp')
} catch (e) {
  log.error(`Could not load sharp: ${e}`)
}

const log = require('@home-gallery/logger')('extractor.image.heic')

const { toPipe, conditionalTask } = require('./task')

const imageTypes = ['rawImage']

const rawPreviewSuffix = 'raw-preview.jpg'

const maxSize = 1920

const jpgOptions = {quality: 80, chromaSubsampling: '4:4:4'}

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

const convertHeic = (src, size, cb) => {
  fs.readFile(src, (err, buffer) => {
    if (err) {
      log.error(err, `Failed to read file ${src}`)
      return cb(new Error(`Failed to read file ${src}: ${err}`))
    }
    const t0 = Date.now()
    heicDecode({ buffer })
      .then(({width, height, data}) => {
        log.debug(t0, `Decoded heif from ${src} to image data of ${width}x${height} pixels`)
        const image = sharp(arrayBuffer2Buffer(data), { raw: {width, height, channels: 4}})
        const resize = Math.max(width, height) > size ? image.resize({width: size, height: size, fit: 'inside'}) : image
        return resize.jpeg(jpgOptions).toBuffer()
      })
      .then(buf => cb(null, buf))
      .catch(cb)
  })
}

function heicPreview(storage) {
  
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
    convertHeic(heicEntry.src, maxSize, (err, buffer) => {
      if (err) {
        log.error(err, `Could not convert heic image of ${heicEntry}: ${err}`)
        return cb()
      }
      storage.writeEntryFile(entry, rawPreviewSuffix, buffer, (err) => {
        if (err) {
          log.error(`Could write heic image preview of ${entry}: ${err}`)
        }
        log.debug(t0, `Created jpg preview image from heic image of ${entry}`)
        cb()
      })
    })
  }

  return toPipe(conditionalTask(test, task))

}

module.exports = heicPreview