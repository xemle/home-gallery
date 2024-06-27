import Logger from '@home-gallery/logger'

const log = Logger('database.media.video')

import { getEntryMetaByKey } from './utils.js'

const handleDuration = (videoStream, result) => {
  if (videoStream?.duration) {
    result.duration = +(+videoStream?.duration || 0).toFixed(0)
  }
}

const hasSize = videoStream => videoStream?.height > 0 && videoStream?.width > 0

const isRotated = videoStream => {
  const displayMatrix = videoStream?.side_data_list?.find(s => s.side_data_type == 'Display Matrix')
  return [-90, 90].includes(displayMatrix?.rotation)
}

const handleWidthHeight = (videoStream, result) => {
  if (!hasSize(videoStream)) {
    return result
  } else if (isRotated(videoStream)) {
    result.width = videoStream.height
    result.height = videoStream.width
  } else {
    result.width = videoStream.width
    result.height = videoStream.height
  }
}

export const getVideo = (entry) => {
  if (entry.type != 'video') {
    return {}
  }
  const streams = getEntryMetaByKey(entry, 'ffprobe')?.streams
  if (!streams) {
    return {}
  }
  const result = {}
  const videoStream = streams.find(s => s.codec_type == 'video')

  handleDuration(videoStream, result)
  handleWidthHeight(videoStream, result)

  return result
}
