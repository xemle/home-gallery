
const log = require('@home-gallery/logger')('extractor.ffmpeg');

const { getNativeCommand } = require('./native-command')

const getFfmpegPaths = options => {
  let ffmpegPath
  if (options.useNative?.includes('ffmpeg')) {
    log.debug(`Use native system command ffmpeg`)
    ffmpegPath = getNativeCommand('ffmpeg')
  } else {
    ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
  }

  let ffprobePath
  if (options.useNative?.includes('ffprobe')) {
    log.debug(`Use native system command ffprobe`)
    ffprobePath = getNativeCommand('ffprobe')
  } else {
    ffprobePath = require('@ffprobe-installer/ffprobe').path
  }

  return [ffmpegPath, ffprobePath]
}

module.exports = {
  getFfmpegPaths
}