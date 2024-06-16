import t from 'tap'

import { getVideo } from './video.js'

t.test('video', async t => {
  t.test('no video entry', async t => {
    const entry = {
      type: 'image',
      meta: {
      }
    }

    const video = getVideo(entry)
    t.match(video, {}, 'No video files should be empty')
  })

  t.test('no ffprobe', async t => {
    const entry = {
      type: 'video',
      meta: {
      }
    }

    const video = getVideo(entry)
    t.match(video, {}, 'Missing ffprobe files should be empty')
  })

  t.test('duration', async t => {
    const entry = {
      type: 'video',
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'video',
              duration: '84.565821'
            }
          ]
        }
      }
    }

    const video = getVideo(entry)
    t.match(video.duration, 85, 'duration should be rounded')
  })

  t.test('get width and height', async t => {
    const entry = {
      type: 'video',
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'video',
              width: 1920,
              height: 1080,
            }
          ]
        }
      }
    }

    const video = getVideo(entry)
    t.type(video.width, 1920, 'width should be 1920')
    t.type(video.height, 1080, 'height should be 1080')
  })

  t.test('180 rotation', async t => {
    const entry = {
      type: 'video',
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'video',
              width: 1920,
              height: 1080,
              side_data_list: [
                {
                  side_data_type: 'Display Matrix',
                  rotation: 180
                }
              ]
            }
          ]
        }
      }
    }

    const video = getVideo(entry)
    t.type(video.width, 1920, 'width should be 1920 on 180 degree rotation')
    t.type(video.height, 1080, 'height should be 1080 on 180 degree rotation')
  })

  t.test('rotation ccw', async t => {
    const entry = {
      type: 'video',
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'video',
              width: 1920,
              height: 1080,
              side_data_list: [
                {
                  side_data_type: 'Display Matrix',
                  rotation: -90
                }
              ]
            }
          ]
        }
      }
    }

    const video = getVideo(entry)
    t.match(video.width, 1080, 'ccw rotated width expected')
    t.match(video.height, 1920, 'ccw rotated height expected')
  })

  t.test('rotation cw', async t => {
    const entry = {
      type: 'video',
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'video',
              width: 1920,
              height: 1080,
              side_data_list: [
                {
                  side_data_type: 'Display Matrix',
                  rotation: 90
                }
              ]
            }
          ]
        }
      }
    }

    const video = getVideo(entry)
    t.match(video.width, 1080, 'cw rotated width expected')
    t.match(video.height, 1920, 'cw rotated height expected')
  })

})
