
const log = require('@home-gallery/logger')('extractor.ffmpeg');

const { getNativeCommand } = require('./native-command')

const getFfmpegPath = config => {
  if (config?.extractor?.useNative?.includes('ffmpeg')) {
    log.debug(`Use native system command ffmpeg`)
    return getNativeCommand('ffmpeg')
  } else {
    return require('@ffmpeg-installer/ffmpeg').path
  }
}

const getFprobePath = config => {
  if (config?.extractor?.useNative?.includes('ffprobe')) {
    log.debug(`Use native system command ffprobe`)
    return getNativeCommand('ffprobe')
  } else {
    return require('@ffprobe-installer/ffprobe').path
  }
}

module.exports = {
  getFfmpegPath,
  getFprobePath
}