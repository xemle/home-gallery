import { ExifTool } from 'exiftool-vendored'

import Logger from '@home-gallery/logger'

const log = Logger('extractor.image.rawPreview')

import { toPipe, conditionalTask } from '../../stream/task.js'

const rawPreviewSuffix = 'raw-preview.jpg'

const rawImageTypes = ['rawImage']

const fileExtension = filename => {
  const pos = filename.lastIndexOf('.')
  return pos > 0 ? filename.slice(pos + 1).toLowerCase() : ''
}

const isJpg = entry => fileExtension(entry.filename) == 'jpg'

const hasJpg = entry => isJpg(entry) || entry.sidecars?.find(isJpg)

const hasEmbeddedPreview = entry => {
  const exif = entry.meta?.exif || {}
  return !!exif.PreviewImage
}

export const embeddedRawPreview = (storage, {exiftool}) => {
  const test = entry => { 
    if (!rawImageTypes.includes(entry.type) || storage.hasEntryFile(entry, rawPreviewSuffix) || hasJpg(entry)) {
      return false
    } else if (hasEmbeddedPreview(entry)) {
      return true
    }
    log.warn(`Raw image ${entry} has no JPG sidecar nor a embedded preview image. Skip raw image`)
    return false
  }

  const task = (entry, cb) => {
    const src = entry.src

    const t0 = Date.now()
    const previewFile = storage.getEntryFilename(entry, rawPreviewSuffix)
    exiftool.extractPreview(src, previewFile)
      .then(() => exiftool.read(previewFile))
      .then(tags => {
        storage.addEntryFilename(entry, rawPreviewSuffix)
        log.debug(t0, `Extracted raw preview image with size of ${tags.ImageWidth}x${tags.ImageHeight} from ${entry}`)
        cb()
      })
      .catch(err => {
        log.warn(err, `Could not extract raw preview image of ${entry}: ${err}`)
        cb()
      })
  }

  return toPipe(conditionalTask(test, task))
}

export default embeddedRawPreview