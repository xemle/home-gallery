import Logger from '@home-gallery/logger'

import { toPlugin } from '../pluginUtils.js';

const log = Logger('extractor.image.preview');

const rawPreviewSuffix = 'raw-preview.jpg'

const fileExtension = filename => {
  const pos = filename.lastIndexOf('.')
  return pos > 0 ? filename.slice(pos + 1).toLowerCase() : ''
}

const isSupportedImage = entry => fileExtension(entry.filename).match(/(jpe?g|jpe|png|tiff?|gif|thm|webp)/)

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {import('./image-resizer.js').ImageResizer} imageResizer
 * @param {import('@home-gallery/types').TExtractorEntry} entry
 * @param {string} src
 * @param {number[]} previewSizes
 * @param {(size: number) => string} sizeToImagePreviewSuffix
 */
async function resizeImage(storage, imageResizer, entry, src, previewSizes, sizeToImagePreviewSuffix) {
  const firstMissingIndex = previewSizes.findIndex(size => !storage.hasFile(entry, sizeToImagePreviewSuffix(size)))
  if (firstMissingIndex < 0) {
    return
  }

  let createdPreviewSizes = []
  /** @type {import('@home-gallery/types').TLocalStorageFile} */
  let newFiles = []
  /** @type {import('@home-gallery/types').TLocalStorageFile} */
  let existingFiles = []

  const missingPreviewSizes = previewSizes.slice(firstMissingIndex)
  if (firstMissingIndex > 0) {
    const lastSize = previewSizes[firstMissingIndex - 1]
    const localFile = await storage.createLocalFile(entry, sizeToImagePreviewSuffix(lastSize))
    src = localFile.file
    existingFiles.push(localFile)
  }

  let index = 0;
  const next = async () => {
    if (index === missingPreviewSizes.length) {
      return
    }

    const size = missingPreviewSizes[index++];
    const suffix = sizeToImagePreviewSuffix(size);

    if (storage.hasFile(entry, suffix)) {
      const localFile = await storage.createLocalFile(entry, suffix)
      existingFiles.push(localFile)
      src = localFile.file
      return next();
    }

    const newFile = await storage.createLocalFile(entry, suffix)
    newFiles.push(newFile)
    return imageResizer(src, newFile.file, size)
      .then(() => {
        createdPreviewSizes.push(size)
        src = newFile.file
        return next()
      })
  }

  return next()
    .then(() => {
      return createdPreviewSizes
    })
    .finally(async () => {
      // Cleanup local storage files
      await Promise.all(newFiles.map(file => file.commit()))
      await Promise.all(existingFiles.map(file => file.release()))
      newFiles = []
      existingFiles = []
    })
}

const getMaxImageSizeBy = exif => {
  if (exif && exif.ImageWidth && exif.ImageHeight) {
    return Math.max(exif.ImageWidth, exif.ImageHeight)
  }
  return 0
}

/**
 * @typedef {Function} ImagePreviewCreator
 * @param {import('@home-gallery/types').TExtractorEntry} entry
 * @param {string} src
 * @param {number[]} [previewSizes]
 * @returns {Promise<number[]>}
 */

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {ImagePreviewCreator} createImagePreviews
 * @param {number[]} previewSizes
 * @returns {import('stream').Transform}
 */
function imagePreview(storage, createImagePreviews, previewSizes) {
  const defaultMaxSize = Math.max(...previewSizes)

  const test = entry => (entry.type === 'image' && isSupportedImage(entry)) || storage.hasFile(entry, rawPreviewSuffix)

  /**
   * @param {import('@home-gallery/types').TExtractorEntry} entry
   */
  const task = async (entry) => {
    const t0 = Date.now();
    let src
    let localEntry
    if (storage.hasFile(entry, rawPreviewSuffix)) {
      localEntry = await storage.createLocalFile(entry, rawPreviewSuffix)
      src = localEntry.file
    } else {
      src = await entry.getFile()
    }

    const size = getMaxImageSizeBy(entry.meta.rawPreviewExif) || getMaxImageSizeBy(entry.meta.exif) || defaultMaxSize
    const resizePreviewSizes = previewSizes.filter(s => s <= size)

    return createImagePreviews(entry, src, resizePreviewSizes)
      .then(createdSizes => {
        if (createdSizes.length > 0) {
          log.info(t0, `Created ${createdSizes.length} image previews from ${entry} with sizes of ${createdSizes.join(',')}`)
        }
      })
      .catch(err => {
        log.error(err, `Could not calculate image previews of ${entry}: ${err}`);
      })
      .finally(() => localEntry?.release())
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
const imagePreviewPlugin = manager => ({
  name: 'imagePreview',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create(storage) {
    const context = manager.getContext()
    const { imageResizer, imagePreviewSizes } = context
    const sizeToImagePreviewSuffix = size => `image-preview-${size}.jpg`

    /**
     * @type ImagePreviewCreator
     */
    const createImagePreviews = async (entry, imageSrc, previewSizes = imagePreviewSizes) => {
      return resizeImage(storage, imageResizer, entry, imageSrc, previewSizes, sizeToImagePreviewSuffix)
    }

    context.createImagePreviews = createImagePreviews
    context.sizeToImagePreviewSuffix = sizeToImagePreviewSuffix

    return imagePreview(storage, createImagePreviews, imagePreviewSizes)
  },
})

const plugin = toPlugin(imagePreviewPlugin, 'imagePreviewExtractor', ['metaExtractor', 'imageResizeExtractor', 'embeddedRawPreviewExtractor'])

export default plugin