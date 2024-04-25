import Vibrant from 'node-vibrant';

import Logger from '@home-gallery/logger'

const log = Logger('extractor.vibrant');

import { toPipe, conditionalTask } from '../../stream/task.js';
import { toPlugin } from '../pluginUtils.js';

const vibrantSuffix = 'vibrant.json';

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {number[]} imagePreviewSizes
 * @returns {import('stream').Transform}
 */
export async function vibrant(storage, imagePreviewSuffix) {

  const test = entry => storage.hasFile(entry, imagePreviewSuffix) && !storage.hasFile(entry, vibrantSuffix)

  const task = async (entry) => {
    const t0 = Date.now();
    const localFile = await storage.createLocalFile(entry, imagePreviewSuffix)

    return new Promise((resolve, reject) => {
      Vibrant
        .from(localFile.file)
        .getPalette((err, palette) => {
          if (err) {
            return reject(err)
          }
          resolve(palette)
        })
    })
    .then(palette => storage.writeFile(entry, vibrantSuffix, palette))
    .then(() => {
      log.debug(t0, `Extracted vibrant colors from ${entry}`);
    })
    .catch(err => {
      log.error(err, `Could not extract vibrant colors of ${entry}: ${err}`);
    })
    .finally(async () => {
      return localFile?.release()
    })
  }

  return {
    test,
    task
  }
}

const createImagePreviewSuffix = (imagePreviewSizes) => {
  const imageSize = imagePreviewSizes.filter(size => size <= 256).shift()
  if (!imageSize) {
    log.warn(`Could not find preview image size (<= 256) for vibrant image from preview sizes ${imagePreviewSizes}. Disable vibrant color extraction`)
  }

  return `image-preview-${imageSize || 128}.jpg`;
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const vibrantPlugin = {
  name: 'vibrant',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const { storage, imagePreviewSizes } = context
    const imagePreviewSuffix = createImagePreviewSuffix(imagePreviewSizes)
    return vibrant(storage, imagePreviewSuffix)
  },
}

const plugin = toPlugin(vibrantPlugin, 'vibrantExtractor', ['imagePreviewExtractor'])

export default plugin
