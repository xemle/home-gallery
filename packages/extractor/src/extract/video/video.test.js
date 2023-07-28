const t = require('tap')

const { getFfmpegOptions } = require('./video')

t.test('getFfmpegOptions', async t => {
  const roatedEntry = {
    meta: {
      ffprobe: {
        streams: [
          {
            codec_type: 'video',
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

  t.test('basic', async t => {
    const options = getFfmpegOptions({}, {})
    t.match(options, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('rotated video', async t => {
    const options = getFfmpegOptions(roatedEntry, {})
    t.match(options, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=\'min(720,iw)\':-2,format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('custom video size', async t => {
    const options = getFfmpegOptions({}, {size: 1920})
    t.match(options, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(1920,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })


})