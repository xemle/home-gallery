import Logger from '@home-gallery/logger'
import { spawn } from '@home-gallery/common'

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
    return callFfprobe(ffprobePath, src)
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

async function callFfprobe(ffprobePath, src) {
  const args = '-v quiet -print_format json -show_format -show_streams'.split(' ')
  args.push(src)
  return new Promise((resolve, reject) => {
    const stdout = []
    const stderr = []

    const ffprobe = spawn(ffprobePath, args, { stdio: 'pipe' })
    ffprobe.once('exit', code => {
      if (code) {
        const lastLine = stderr.join('').split('\n').filter(Boolean).pop()
        reject(new Error(`Failed to run ffprobe. Exit code is ${code}: ${lastLine}`))
        return
      }
      const out = stdout.join('')
      try {
        const json = JSON.parse(out)
        return resolve(json)
      } catch (e) {
        reject(new Error(`Failed to parse out as json: ${out}`, {cause: e}))
      }
    })

    ffprobe.stdout.on('data', data => stdout.push(data.toString()))
    ffprobe.stderr.on('data', data => stderr.push(data.toString()))
  })
}

/**
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns {import('@home-gallery/types').TExtractor}
 */
export const ffprobePlugin = manager => ({
  name: 'ffprobe',
  phase: 'meta',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create(storage) {
    const config = manager.getConfig()
    const ffprobePath = await getFfprobePath(config)
    const ffmpegPath = await getFfmpegPath(config)

    const context = manager.getContext()
    context.ffprobePath = ffprobePath
    context.ffmpegPath = ffmpegPath

    return ffprobe(storage, ffprobePath)
  },
})
