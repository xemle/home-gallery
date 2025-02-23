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
  const test = entry => entry.type === 'video' && needsUpgrade(entry.meta?.ffprobe)

  const _gallery = { version: 2 }

  const task = async (entry) => {
    const t0 = Date.now();
    const src = await entry.getFile()
    return spawnFfprobe(ffprobePath, src)
      .then(stdout => {
        try {
          return JSON.parse(stdout)
        } catch (e) {
          throw new Error(`Failed to parse out as json: ${stdout}`, {cause: e})
        }
      })
      .then(data => storage.writeFile(entry, ffprobeSuffix, {...data, _gallery}))
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

async function spawnFfprobe(ffprobePath, src) {
  const args = '-v quiet -print_format json -show_format -show_streams'.split(' ')
  args.push(src)
  return new Promise((resolve, reject) => {
    const stdoutData = []
    const stderrData = []
    let errorHandled = false

    const ffprobe = spawn(ffprobePath, args, { stdio: 'pipe' })
    ffprobe.once('exit', (code, signal) => {
      if (errorHandled) {
        return
      }
      const stdout = stdoutData.join('')
      const stderr = stderrData.join('')
      const lastErrLine = stderr.split('\n').filter(Boolean).pop()
      if (signal) {
        return reject(new Error(`Failed to run ffprobe. Terminated with signal ${signal}: ${lastErrLine}`))
      }
      if (code) {
        return reject(new Error(`Failed to run ffprobe. Exit code is ${code}: ${lastErrLine}`))
      }

      resolve(stdout)
    })
    ffprobe.once('error', cause => {
      errorHandled = true
      reject(new Error(`Failed to run ffprobe: ${cause}`, { cause }))
    })

    ffprobe.stdout.on('data', data => stdoutData.push(data.toString()))
    ffprobe.stderr.on('data', data => stderrData.push(data.toString()))
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

function needsUpgrade(ffprobe) {
  if (!ffprobe) {
    return true
  }

  const version = ffprobe._gallery?.version || 1
  if (version == 1) {
    log.debug(`Recreate ffprobe due extractor upgrade`)
    return true
  }
  return false
}
