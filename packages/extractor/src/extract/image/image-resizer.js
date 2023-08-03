const { Buffer } = require('buffer')
const { spawn } = require('child_process')

const log = require('@home-gallery/logger')('extractor.image.resize')

const { getNativeCommand } = require('../utils/native-command')

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
      const err = new Error(`${command} exit with error code ${code}`)
      Object.assign(err, result)
      log.debug(err, err.message)
      return cb(err)
    }
    log.trace(t0, `Exec: ${command} ${args.map(arg => arg.match(/[\\\/ \t\r]/) ? `'${arg}'` : arg).join(' ')} with exit code ${code}`)
    cb(null, result)
  })
  cmd.on('err', cb)
}

const errorResizer = (src, dst, size, cb) => cb(new Error(`Image resizer could not be initialized`))

const getSharpResize = async (factoryOptions) => {
  let sharp
  try {
    sharp = require('sharp')
  } catch (e) {
    throw new Error(`Could not load sharp`)
  }

  const jpgOptions = {
    quality: factoryOptions.quality,
    progressive: true,
    optimiseCoding: true,
    mozjpeg: true // same as {trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3}
  }

  return (src, dst, size, cb) => {
    sharp(src, {failOnError: false})
      .rotate()
      .resize({width: size, height: size, fit: 'inside'})
      .jpeg(jpgOptions)
      .toFile(dst, cb)
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

  return new Promise((resolve, reject) => {
    run(vipsthumbnail, ['--vips-version'], (err, {code, stderr, stdout}) => {
      if (err) {
        const e = new Error(`Could not get vipsthumbnail version`)
        Object.assign(e, {code, stderr, stdout})
        return reject(e)
      }
      const version = stdout.split(' ')[1] || '8.9.0'
      const [major, minor] = version.split('.')
      if (major == 8 && minor >= 10) {
        return resolve((src, dst, size, cb) => {
          run(vipsthumbnail, ['-s', `${size}x${size}`, '-o', `${dst}[${vipsthumbnailJpgOptions}]`, src], cb)
        })
      }
      return resolve((src, dst, size, cb) => {
        run(vipsthumbnail, ['-s', `${size}x${size}`, '--rotate', '--delete', '-f', `${dst}[${vipsthumbnailJpgOptions}]`, src], cb)
      })
    })
  })
}

const getConvertResize = async (factoryOptions) => {
  const convert = getNativeCommand('convert')
  return new Promise((resolve, reject) => {
    run(convert, ['--version'], (err, {code, stderr, stdout}) => {
      if (err) {
        const e = new Error(`Could not get convert version`)
        Object.assign(e, {code, stderr, stdout})
        return reject(e)
      }
      const firstLine = stdout.split('\n').shift() || ''
      if (!firstLine.match(/ImageMagick/i)) {
        return reject(new Error(`Unexpected version output: ${firstLine}`))
      }

      resolve((src, dst, size, cb) => {
        run(convert, [src, '-auto-orient', '-resize', `${size}x${size}`, '-strip', '-quality', `${factoryOptions.quality}`, dst], cb)
      })
    })
  })
}

const createImageResizer = (config, cb) => {
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
  const next = () => {
    if (index == resizer.length) {
      log.error(`Could not load an image resizser`)
      cb(null, errorResizer)
    }
    const item = resizer[index++]
    item.factory(factoryOptions)
      .then(imageResizer => {
        log.info(`Use ${item.name} to resize images`)
        cb(null, imageResizer)
      })
      .catch(err => {
        log.warn(err, `Could not load ${item.name} image resizer`)
        next()
      })
  }

  next()
}

const useExternalImageResizer = config => config?.extractor?.useNative?.includes('vipsthumbnail') || config?.extractor?.useNative?.includes('convert')

module.exports = {
  createImageResizer,
  useExternalImageResizer
}
