const t = require('tap')

const { getVideo } = require('./video')

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

})
