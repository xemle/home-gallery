
import Logger from '@home-gallery/logger'

const log = Logger('extractor.ffmpeg');

import { getNativeCommand } from './native-command.js'

export const getFfmpegPath = async config => {
  if (config?.extractor?.useNative?.includes('ffmpeg')) {
    log.debug(`Use native system command ffmpeg`)
    return getNativeCommand('ffmpeg')
  } else {
    return import('@ffmpeg-installer/ffmpeg')
      .then(({path}) => path)
  }
}

export const getFfprobePath = async config => {
  if (config?.extractor?.useNative?.includes('ffprobe')) {
    log.debug(`Use native system command ffprobe`)
    return getNativeCommand('ffprobe')
  } else {
    return import('@ffprobe-installer/ffprobe')
      .then(({path}) => path)
  }
}
