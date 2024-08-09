import Logger from '@home-gallery/logger'

import { toPlugin } from '../pluginUtils.js';

const log = Logger('extractor.image.rawPreview')

const rawPreviewImageSuffix = 'raw-preview.jpg'
const rawPreviewMetaSuffix = 'raw-preview-exif.json'

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

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {ExifTool} exifTool
 * @returns {import('stream').Transform}
 */
const embeddedRawPreview = (storage, exifTool) => {
  const test = entry => { 
    if (!rawImageTypes.includes(entry.type) || storage.hasFile(entry, rawPreviewImageSuffix) || hasJpg(entry)) {
      return false
    } else if (hasEmbeddedPreview(entry)) {
      return true
    }
    log.warn(`Raw image ${entry} has no JPG sidecar nor a embedded preview image. Skip raw image`)
    return false
  }

  const task = async (entry) => {
    const src = await entry.getFile()

    const t0 = Date.now()
    const previewFile = await storage.createLocalFile(entry, rawPreviewImageSuffix)
    return exifTool.extractPreview(src, previewFile.file)
      .then(() => exifTool.read(previewFile.file))
      .then(async tags => {
        await previewFile.commit()
        await storage.writeFile(entry, rawPreviewMetaSuffix, tags)
        log.debug(t0, `Extracted raw preview image with size of ${tags.ImageWidth}x${tags.ImageHeight} from ${entry}`)
      })
      .catch(err => {
        log.warn(err, `Could not extract raw preview image of ${entry}: ${err}`)
        cb()
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
const embeddedRawPreviewPlugin = manager => ({
  name: 'embeddedRawPreview',
  phase: 'raw',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create(storage) {
    const context = manager.getContext()
    const { exifTool } = context

    return embeddedRawPreview(storage, exifTool)
  },
})

const plugin = toPlugin(embeddedRawPreviewPlugin, 'embeddedRawPreviewExtractor', ['metaExtractor'])

export default plugin