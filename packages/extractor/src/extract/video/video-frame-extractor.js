import ffmpeg from 'fluent-ffmpeg';

import Logger from '@home-gallery/logger'
import { noop } from '@home-gallery/stream';

import { toPlugin } from '../pluginUtils.js';

const log = Logger('extractor.video.frameExtractor');

export const createVideoFrameExtractor = (ffmpegPath, ffprobePath) => {
  /**
   * @param {string} src
   * @param {string} dir
   * @param {string} filenamePattern
   * @param {string} frameCount
   */
  return async (src, dir, filenamePattern, frameCount) => {
    return new Promise((resolve, reject) => {
      const t0 = Date.now();

      let files = [];
      const timemarks = new Array(frameCount).fill(0).map((_, i) => `${(100*i/frameCount).toFixed(1)}%`)
      const command = ffmpeg(src);
      command.setFfmpegPath(ffmpegPath);
      command.setFfprobePath(ffprobePath);
      command
        .on('error', reject)
        .on('filenames', (filenames) => files = filenames)
        .on('end', () => {
          log.debug(t0, `Extracted ${files.length} video frames from ${src}`);
          resolve(files);
        })
        .screenshot({
          timemarks,
          folder: dir,
          filename: filenamePattern
        });
    })
  }
}

/**
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns {import('@home-gallery/types').TExtractor}
 */
const videoFramePlugin = manager => ({
  name: 'videoFrame',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create() {
    const context = manager.getContext()
    const { ffmpegPath, ffprobePath } = context

    const videoFrameExtractor = createVideoFrameExtractor(ffmpegPath, ffprobePath)
    context.videoFrameExtractor = videoFrameExtractor
    
    return noop()
  },
})

const plugin = toPlugin(videoFramePlugin, 'videoFrameExtractor', ['metaExtractor'])

export default plugin