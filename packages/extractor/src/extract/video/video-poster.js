import path from 'path'
import Logger from '@home-gallery/logger'

const log = Logger('extractor.video.poster');

import { toPlugin } from '../pluginUtils.js';

const videoPosterSuffix = 'video-poster.jpg';

const getMaxVideoSize = (entry, defaultSize) => {
  return entry.meta.ffprobe?.streams
    .filter(stream => stream.codec_type == 'video' && stream.width && stream.height)
    .reduce((size, stream) => Math.max(size, stream.width, stream.height), 0)
    || defaultSize
}

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {import('../image/image-preview.js').ImagePreviewCreator} createImagePreviews
 * @param {number[]} imagePreviewSizes
 * @returns {import('stream').Transform}
 */
async function videoPoster(storage, videoFrameExtractor, createImagePreviews, imagePreviewSizes) {
  const maxImagePreviewSize = Math.max(...imagePreviewSizes)

  const test = entry => entry.type === 'video' && !storage.hasFile(entry, videoPosterSuffix);

  /**
   * @param {import('@home-gallery/types').TExtractorEntry} entry
   */
  const task = async (entry) => {
    const t0 = Date.now();
    const src = await entry.getFile()
    const localDir = await storage.createLocalDir()

    return videoFrameExtractor(src, localDir.dir, 'video-frame-%00i.jpg', 1)
      .then(async filenames => {
        if (!filenames.length) {
          throw new Error(`No video frames could be extracted from ${entry}`)
        }

        const posterSrc = path.resolve(localDir.dir, filenames[0])
        await storage.copyFile(entry, videoPosterSuffix, posterSrc)

        const size = getMaxVideoSize(entry, maxImagePreviewSize)
        const previewSizes = imagePreviewSizes.filter(previewSize => previewSize <= size)
        return createImagePreviews(entry, posterSrc, previewSizes)
      })
      .then(previewSizes => {
        log.debug(t0, `Created ${previewSizes.length} video preview images from ${entry} with sizes of ${previewSizes.join(',')}`);
      })
      .catch(err => {
        log.warn(err, `Could not extract video frame from ${entry}: ${err}`)
      })
      .finally(async () => {
        return localDir?.release()
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
const videoPosterPlugin = manager => ({
  name: 'videoPoster',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create(storage) {
    const context = manager.getContext()
    const { videoFrameExtractor, createImagePreviews, imagePreviewSizes } = context

    return videoPoster(storage, videoFrameExtractor, createImagePreviews, imagePreviewSizes)
  },
})

const plugin = toPlugin(videoPosterPlugin, 'videoPosterExtractor', ['imagePreviewExtractor', 'videoFrameExtractor'])

export default plugin