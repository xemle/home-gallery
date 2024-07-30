import path from 'path'
import { Buffer } from 'buffer'
import { spawn } from 'child_process'

import Logger from '@home-gallery/logger'

import { getNativeCommand } from '../utils/native-command.js'
import { toPlugin } from '../pluginUtils.js';
import { noop } from '@home-gallery/stream';

const log = Logger('extractor.image.resize')

/**
 * @typedef {Function} ImageResizer
 * @param {string} src
 * @param {string} dist
 * @param {number} size
 * @returns {Promise<void>}
 */

const run = (command, args, cb) => {
  const t0 = Date.now()
  const defaults = {
    shell: false,
    stdio: 'pipe',
  }

  const env = {...process.env}
  const cmd = spawn(command, args, {...defaults, env})
  const stdout = []
  const stderr = []
  cmd.stdout.on('data', chunk => stdout.push(chunk))
  cmd.stderr.on('data', chunk => stderr.push(chunk))
  cmd.on('exit', (code, signal) => {
    const result = {
      code,
      signal,
      stdout: Buffer.concat(stdout).toString('utf-8'),
      stderr: Buffer.concat(stderr).toString('utf-8')
    }
    if (code != 0) {
      const err = new Error(`${command} exit with exit code ${code}`)
      Object.assign(err, result)
      return cb(err)
    }
    log.trace(t0, `Exec: ${command} ${args.map(arg => arg.match(/[\\\/ \t\r]/) ? `'${arg}'` : arg).join(' ')} with exit code ${code}`)
    cb(null, result)
  })
  cmd.on('error', cb)
}

const runAsync = (command, args) => new Promise((resolve, reject) => {
  run(command, args, (err, result) => {
    if (err) {
      return reject(err)
    }
    resolve(result)
  })
})

const errorResizer = async () => Promise.reject(new Error(`Image resizer could not be initialized`))

const getSharpResize = async (factoryOptions) => {
  let {default: sharp} = await import('sharp')

  const jpgOptions = {
    quality: factoryOptions.quality,
    progressive: true,
    optimiseCoding: true,
    mozjpeg: true // same as {trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3}
  }

  return (src, dst, size) => {
    return new Promise((resolve, reject) => {
      sharp(src, {failOnError: false})
      .rotate()
      .resize({width: size, height: size, fit: 'inside'})
      .jpeg(jpgOptions)
      .toFile(dst, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }
}

const getVipsResize = async (factoryOptions) => {
  const vipsthumbnail = getNativeCommand('vipsthumbnail')

  const vipsthumbnailJpgOptions = [
    `Q=${factoryOptions.quality}`, // jpg quality
    'interlace',
    'optimize-coding',
    'trellis-quant', 'overshoot-deringing', 'optimize-scans', 'quant-table=3', // mozjpeg defaults
    'strip', // no meta data
  ].join(',')

  return runAsync(vipsthumbnail, ['--vips-version'])
    .then(({stdout}) => {
      const version = stdout.split(' ')[1] || '8.9.0'
      const [major, minor] = version.split('.')
      if (major == 8 && minor >= 10) {
        return (src, dst, size) => {
          const out = path.resolve(dst) // vips handles relative path differently. Use absolute filename
          return runAsync(vipsthumbnail, ['-s', `${size}x${size}`, '-o', `${out}[${vipsthumbnailJpgOptions}]`, src])
        }
      }
      return (src, dst, size) => {
        const out = path.resolve(dst) // vips handles relative path differently. Use absolute filename
        return runAsync(vipsthumbnail, ['-s', `${size}x${size}`, '--rotate', '--delete', '-f', `${out}[${vipsthumbnailJpgOptions}]`, src])
      }
    })
    .catch(err => {
      throw new Error(`Could not get vipsthumbnail version`, {cause: err})
    })
}

const getConvertResize = async (factoryOptions) => {
  const convert = getNativeCommand('convert')

  return runAsync(convert, ['--version'])
    .then(({stdout}) => {
      const firstLine = stdout.split('\n').shift() || ''
      if (!firstLine.match(/ImageMagick/i)) {
        throw new Error(`Unexpected version output: ${firstLine}`)
      }

      return (src, dst, size) => {
        return runAsync(convert, [src, '-auto-orient', '-resize', `${size}x${size}`, '-strip', '-quality', `${factoryOptions.quality}`, dst])
      }
    })
}

/**
 * @param {object} config
 * @returns {Promise<ImageResizer>}
 */
export const createImageResizer = async (config) => {
  const useNative = config?.extractor?.useNative || []

  const resizer = [
    { active: useNative.includes('vipsthumbnail'), factory: getVipsResize, name: 'vipthumbnail' },
    { active: useNative.includes('convert'), factory: getConvertResize,    name: 'convert' },
    { active: true, factory: getSharpResize,   name: 'sharp' },
    { active: true, factory: getVipsResize,    name: 'vipthumbnail fallback' },
    { active: true, factory: getConvertResize, name: 'convert fallback' },
  ].filter(item => item.active)

  const factoryOptions = {
    quality: +(config?.extrator?.image?.previewQuality || 80)
  }

  let index = 0
  const next = async () => {
    if (index == resizer.length) {
      log.error(`Could not load an image resizer`)
      return errorResizer
    }
    const item = resizer[index++]
    return item.factory(factoryOptions)
      .then(imageResizer => {
        log.info(`Use ${item.name} to resize images`)
        return imageResizer
      })
      .catch(err => {
        log.warn(err, `Could not load ${item.name} image resizer`)
        return next()
      })
  }

  return next()
}

export const useExternalImageResizer = config => config?.extractor?.useNative?.includes('vipsthumbnail') || config?.extractor?.useNative?.includes('convert')

const byNumberDesc = (a, b) => b - a

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const imageResizerPlugin = {
  name: 'imageResizer',
  phase: 'meta',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const imageResizer = await createImageResizer(config)
    const previewSizes = config?.extractor?.image?.previewSizes || [1920, 1280, 800, 320, 128]

    context.imageResizer = imageResizer
    context.imagePreviewSizes = previewSizes.sort(byNumberDesc)
    context.isNativeImageResizer = useExternalImageResizer(config)

    return noop()
  }
}

const plugin = toPlugin(imageResizerPlugin, 'imageResizeExtractor')

export default plugin