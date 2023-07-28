const getVideoStream = (entry) => {
  const streams = entry.meta?.ffprobe?.streams
  return streams?.find(stream => stream.codec_type == 'video')
}

const isVideoRotated = (video) => {
  const displayMatrix = video?.side_data_list?.find(sideData => sideData.side_data_type == 'Display Matrix')
  return [-90, 90].includes(displayMatrix?.rotation)
}

const fixRotatedScale = (rotated) => {
  if (!rotated) {
    return v => v
  }
  return v => {
    if (!v.match(/scale=/)) {
      return v
    } else if (v.match(/ /)) {
      return v.split(' ').map(fixRotatedScale(rotated)).join(' ')
    }
    const match = v.match(/scale=([^:]+):(\'[^']+\'|[^,]+)/)
    if (!match) {
      return v
    }
    return v.substring(0, match.index) + 
      `scale=${match[2].replace('ih', 'iw')}:${match[1].replace('iw', 'ih')}` +
      v.substring(match.index + match[0].length)
  }
}

module.exports = {
  getVideoStream,
  isVideoRotated,
  fixRotatedScale
}