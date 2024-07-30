import ffprobeBin from 'ffprobe';

import Logger from '@home-gallery/logger'

import { getFfprobePath, getFfmpegPath } from '../utils/ffmpeg-path.js'

const log = Logger('extractor.video.ffprobe');
const ffprobeSuffix = 'ffprobe.json';

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {string} ffprobePath
 * @returns {import('stream').Transform}
 */
export function ffprobe(storage, ffprobePath) {
  const test = entry => entry.type === 'video' && !storage.hasFile(entry, ffprobeSuffix);

  const task = async (entry) => {
    const t0 = Date.now();
    const src = await entry.getFile()
    return new Promise((resolve, reject) => {
      ffprobeBin(src, { path: ffprobePath }, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
    .then(data => storage.writeFile(entry, ffprobeSuffix, data))
    .then(() => {
      log.debug(t0, `Extracted video meta data from ${entry}`);
    })
    .catch(err => {
      log.warn(err, `Could not extract video meta data from ${entry}: ${err}`);
    })
  }

  return {
    test,
    task
  }
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
export const ffprobePlugin = {
  name: 'ffprobe',
  phase: 'meta',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const ffprobePath = await getFfprobePath(config)
    const ffmpegPath = await getFfmpegPath(config)

    context.ffprobePath = ffprobePath
    context.ffmpegPath = ffmpegPath

    return ffprobe(context.storage, ffprobePath)
  },
}
