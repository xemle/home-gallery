const log = require('@home-gallery/logger')('database.media.video')

const { getEntryMetaByKey } = require('./utils')

const getVideo = (entry) => {
  if (entry.type != 'video') {
    return {}
  }
  const streams = getEntryMetaByKey(entry, 'ffprobe')?.streams
  if (!streams) {
    return {}
  }
  const result = {}

  const videoStream = streams.find(s => s.codec_type == 'video')
  if (videoStream?.duration) {
    console.log(`foo`)
    result.duration = +(+videoStream?.duration || 0).toFixed(0)
  }
  return result
}

module.exports = {
  getVideo
}
