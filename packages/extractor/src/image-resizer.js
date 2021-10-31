const { Buffer } = require('buffer')
const { spawn } = require('child_process')

const log = require('@home-gallery/logger')('extractor.image.resize')

const { getNativeCommand } = require('./utils')

const getSharpResizer = cb => {
  let sharp
  try {
    sharp = require('sharp')
  } catch (e) {
    return cb(e)
  }

  cb(null, (src, dst, size, cb) => {
    sharp(src, {failOnError: false})
      .rotate()
      .resize({width: size})
      .jpeg({quality: 80, chromaSubsampling: '4:4:4'})
      .toFile(dst, cb)
  })
}

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

const getVipsResize = (cb) => {
  const vipsthumbnail = getNativeCommand('vipsthumbnail')

  run(vipsthumbnail, ['--vips-version'], (err, result) => {
    if (err) {
      return cb(err)
    }
    const { stdout } = result
    const version = stdout.toString().split(' ')[1] || '8.9.0'
    const [major, minor] = version.split('.')
    if (major == 8 && minor >= 10) {
      cb(null, (src, dst, size, cb) => {
        run(vipsthumbnail, ['-s', `${size}x`, '-o', `${dst}[Q=80]`, src], cb)
      })
    }
    return cb(null, (src, dst, size, cb) => {
      run(vipsthumbnail, ['-s', `${size}x`, '--rotate', '--delete', '-f', `${dst}[Q=80]`, src], cb)
    })
  })
}

const createImageResizer = (options, cb) => {
  if (options.useNative.includes('vipsthumbnail')) {
    log.debug('Use native system command vipsthumbnail')
    return getVipsResize((err, vipsResizer) => {
      if (err) {
        log.err(err, `Failed to initialize vipsthumbnail`)
        return cb(null, errorResizer)
      }
      return cb(null, vipsResizer)
    })
  } else if (options.useNative.includes('convert')) {
    log.debug('Use native system command convert')
    const convert = getNativeCommand('convert')
    return cb(null, (src, dst, size, cb) => {
      run(convert, [src, '-auto-orient', '-resize', `${size}x`, '-strip', '-quality', '80', dst], cb)
    })
  } else {
    return getSharpResizer((err, sharpResizer) => {
      if (err) {
        log.err(err, `Failed to initialize sharp`)
        return cb(null, errorResizer)
      }
      cb(null, sharpResizer)
    })
  }
}

module.exports = {
  createImageResizer
}
